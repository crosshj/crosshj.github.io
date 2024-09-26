import { JSDOM } from 'jsdom';
import fs from 'fs';
import { minify } from 'html-minifier';
import { about, projectDetails, services } from './portfolioData.js';

const inlineElements = ({ document }) => {
	const images = document.querySelectorAll('img');
	images.forEach((img) => {
		if (img.src.endsWith('.svg')) {
			const src = img.getAttribute('src');
			// const alt = img.getAttribute('alt');
			const svgPath = new URL(src, import.meta.url).pathname;
			const svg = fs.readFileSync(svgPath, 'utf8');
			img.insertAdjacentHTML('afterend', svg);
			img.remove();
		}

		//inline webp and png images
		if (img.src.endsWith('.webp') || img.src.endsWith('.png')) {
			const src = img.getAttribute('src');
			const imgPath = new URL(src, import.meta.url).pathname;
			const imgData = fs.readFileSync(imgPath, 'base64');
			const imgType = img.src.endsWith('.webp') ? 'webp' : 'png';
			img.src = `data:image/${imgType};base64,${imgData}`;
		}
	});

	// inline scripts where src is not provided
	const scripts = document.querySelectorAll('script');
	scripts.forEach((script) => {
		if (!script.src) return;
		try {
			const scriptPath = new URL(script.src, import.meta.url).pathname;
			const js = fs.readFileSync(scriptPath, 'utf8');
			const newScript = document.createElement('script');
			newScript.textContent = js;
			script.replaceWith(newScript);
		} catch (error) {
			return;
		}
	});

	// inline styles where style is local
	const styles = document.querySelectorAll('link[rel="stylesheet"]');
	styles.forEach((style) => {
		if (!style.href.startsWith('http')) {
			const stylePath = new URL(style.href, import.meta.url).pathname;
			let css = fs.readFileSync(stylePath, 'utf8');

			//inline images in css
			const imgRegex = /url\((.*?)\)/g;
			const imgMatches = css.match(imgRegex);
			if (imgMatches) {
				imgMatches.forEach((match) => {
					const imgPath = match.slice(5, -2);
					if (imgPath.startsWith('http')) return;
					const imgFullPath = new URL(imgPath, import.meta.url)
						.pathname;
					const imgData = fs.readFileSync(imgFullPath, 'base64');
					const imgType = imgFullPath.endsWith('.webp')
						? 'webp'
						: 'png';
					const imgBase64 = `url(data:image/${imgType};base64,${imgData})`;
					css = css.replace(match, imgBase64);
				});
			}
			const newStyle = document.createElement('style');
			newStyle.textContent = css;
			style.replaceWith(newStyle);
		}
	});

	// inline favicon
	const encodeSVG = (data) => {
		const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
		const externalQuotesValue = `double`;
		if (externalQuotesValue === `double`) {
			data = data.replace(/"/g, `'`);
		} else {
			data = data.replace(/'/g, `"`);
		}
		data = data.replace(/>\s{1,}</g, `><`);
		data = data.replace(/\s{2,}/g, ` `);
		data = data.replace(symbols, (match) => encodeURIComponent(match));
		return data;
	};
	const favicon = document.querySelector('link[rel="icon"]');
	if (favicon) {
		const href = favicon.getAttribute('href');
		const faviconPath = new URL(href, import.meta.url).pathname;
		const svg = fs.readFileSync(faviconPath, 'utf8');
		const encoded = encodeSVG(svg);
		favicon.href = `data:image/svg+xml,${encoded}`;
	}
};

const addAbout = ({ document }) => {
	const aboutDiv = document.querySelector('#about');
	aboutDiv.innerHTML = about.map((para) => `<p>${para}</p>`).join('\n');
};

const addProjects = ({ document }) => {
	const workDiv = document.querySelector('#work');

	workDiv.insertAdjacentHTML('beforeend', `<h2>${projectDetails.title}</h2>`);

	const projectDiv = (project) => `
	<div class="project">
		<!-- ${project.comment} -->
		<div class="project-logo">
			<img
				src="${project.logo}"
				alt="${project.title} Logo"
				loading="lazy"
			/>
		</div>
		<div class="project-info text-left">
			<h3>${project.title}</h3>
			${project.description.map((desc) => `<p>${desc}</p>`).join('\n')}
		</div>
	</div>
	`;

	for (const project of projectDetails.list) {
		const projectDivHTML = projectDiv(project);
		workDiv.insertAdjacentHTML('beforeend', projectDivHTML);
	}
};

const addServices = ({ document }) => {
	const servicesDiv = document.querySelector('#services');

	servicesDiv.innerHTML = `
		<h2>${services.title}</h2>
		${services.description.map((para) => `<p>${para}</p>`).join('\n')}
		<ul>
			${services.list.map((item) => `<li>${item}</li>`).join('\n')}
		</ul>
		<p>${services.outro}</p>
	`;
};

export const compile = async ({ index }) => {
	const dom = new JSDOM(index);
	const { document } = dom.window;

	addAbout({ document });
	addProjects({ document });
	addServices({ document });

	inlineElements({ document });

	const serialized = dom.serialize();
	const minified = minify(serialized, {
		minifyCSS: { level: 2 },
		minifyJS: true,
		caseSensitive: true,
		collapseWhitespace: true,
		removeComments: true,
	});

	return minified;
};
