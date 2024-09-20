// Vertex shader
const vertexShaderSource = `
attribute vec4 a_position;
void main() {
    gl_Position = a_position;
}
`;

// Fragment shader
const fragmentShaderSource = `
// adapted from https://shaderoo.org/?shader=K0HEfz
// a pseudo-shaded variant of https://shadertoy.com/view/sdlfRj
precision lowp float;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 U = gl_FragCoord.xy;
    vec2 R = u_resolution;
    U = (U - 0.5 * R) / R.y * 10.0; // Normalize coordinates
    vec4 color = vec4(1.0); // Initialize output color
    float z = 2.0 + sin(u_time * 0.01); // Dynamic depth based on time
    float a = 0.0;
    // Loop to add more complexity to the pattern
    for (int i = -60; i < 10; i++) {
        float fi = float(i); // Cast integer index to float
        a = z * 0.2 * (U.x - sin(fi / 6.0 + u_time * 0.5)); // Adjust the angle
        float dist = length(U); // Get distance to center for radial effect
        float pattern = cos(a + dist * 0.3) * 0.5 - 2.5;
        color += (mod(fi, 2.0) * (0.3 - 0.2 * sin(a)) - color) * 
             smoothstep(0.0, 20.0 / R.y, 3.0 / z * pattern - fi / 6.0 - U.y
        );
    }
    color.a = 1.0;
    gl_FragColor = color;
    // replace white with cycled colors based on time, start with blue
    gl_FragColor.rgb *= 0.5 + 0.5 * cos(40.0+u_time*0.25 + vec3(0, 2, 4));
}
`;

const createShader = (gl, type, source) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('Shader compile failed: ', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return;
	}
	return shader;
};

const createProgram = (gl, vertexShader, fragmentShader) => {
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Program link failed: ', gl.getProgramInfoLog(program));
		return null;
	}
	return program;
};

const getRenderFunction = (args, callback) => {
	const {
		gl,
		program,
		positionAttributeLocation,
		resolutionUniformLocation,
		timeUniformLocation,
		positionBuffer,
		fps = 15,
		speed = 0.5,
	} = args;
	const interval = 1000 / fps; // Time per frame in milliseconds
	let lastFrameTime = 0;
	return function render(time) {
		time *= speed * 0.001; // Convert to seconds

		// Frame rate limiting
		const currentTime = performance.now();
		const delta = currentTime - lastFrameTime;

		if (delta < interval) {
			requestAnimationFrame(render);
			return;
		}

		lastFrameTime = currentTime;

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(program);

		// Set resolution and time uniform
		gl.uniform2f(
			resolutionUniformLocation,
			gl.canvas.width,
			gl.canvas.height
		);
		gl.uniform1f(timeUniformLocation, time);

		// Bind the position buffer
		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(
			positionAttributeLocation,
			2,
			gl.FLOAT,
			false,
			0,
			0
		);

		// Draw the full-screen quad
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		callback();
	};
};

const setupGL = (canvas) => {
	const gl = canvas.getContext('webgl');
	if (!gl) {
		console.error('WebGL not supported');
		return;
	}
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	const fragmentShader = createShader(
		gl,
		gl.FRAGMENT_SHADER,
		fragmentShaderSource
	);
	const program = createProgram(gl, vertexShader, fragmentShader);

	const positionAttributeLocation = gl.getAttribLocation(
		program,
		'a_position'
	);
	const resolutionUniformLocation = gl.getUniformLocation(
		program,
		'u_resolution'
	);
	const timeUniformLocation = gl.getUniformLocation(program, 'u_time');

	// Set up the positions for the full-screen quad
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	return {
		gl,
		program,
		positionAttributeLocation,
		resolutionUniformLocation,
		timeUniformLocation,
		positionBuffer,
	};
};

const DOMContentLoaded = () => {
	const canvas = document.getElementById('backgroundCanvas');
	canvas.width = Math.max(window.innerWidth / 10, 400);
	canvas.height = Math.max(window.innerHeight / 10, 300);
	const glContext = setupGL(canvas);
	const gl = canvas.getContext('webgl');
	if (gl) {
		const render = getRenderFunction(glContext, () =>
			requestAnimationFrame(render)
		);
		requestAnimationFrame(render);
	}
};

document.addEventListener('DOMContentLoaded', DOMContentLoaded);
