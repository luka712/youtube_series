#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoords;
layout(location = 2) in vec3 aColor;

out vec2 vTexCoords;
out vec3 vColor; 

void main()
{
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoords = aTexCoords;
    vColor = aColor;

}