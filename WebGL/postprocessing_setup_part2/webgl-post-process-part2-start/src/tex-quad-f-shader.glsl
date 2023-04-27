#version 300 es
precision mediump float;

in vec2 texCoords;

uniform sampler2D textureSampler;

out vec4 outColor;

void main() 
{
    outColor = texture(textureSampler, texCoords);
}