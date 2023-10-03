#version 300 es 
precision mediump float;

in vec2 v_texCoords;

// scene texture
uniform sampler2D u_texture0;

// other 
uniform sampler2D u_texture1;

uniform float u_mixValue;

out vec4 fragColor;

void main()
{
    vec3 t0 = texture(u_texture0, v_texCoords).rgb; // screen
    vec3 t1 = texture(u_texture1, v_texCoords).rgb; // other

    fragColor = vec4(mix(t0, t1, u_mixValue), 1.0);
}