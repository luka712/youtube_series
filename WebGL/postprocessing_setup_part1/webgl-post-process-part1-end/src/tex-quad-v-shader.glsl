#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoords;


uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

out vec2 texCoords;

void main() 
{
    texCoords = aTexCoords;
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}