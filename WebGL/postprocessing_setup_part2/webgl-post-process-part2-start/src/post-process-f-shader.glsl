#version 300 es
precision mediump float;

in vec2 texCoords;

uniform sampler2D textureSampler;

out vec4 outColor;

void main() 
{
    float luminance = dot(texture(textureSampler, texCoords).rgb, vec3(0.2, 0.7, 0.07));
    outColor = vec4(vec3(luminance), 1.0);
}