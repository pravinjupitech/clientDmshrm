import * as faceapi from 'face-api.js';

export default async function loadModels() {
	await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
	await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
}
