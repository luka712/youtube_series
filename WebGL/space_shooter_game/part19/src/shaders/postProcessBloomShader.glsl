#version 300 es 
precision mediump float;

in vec2 v_texCoords;

// tex0
uniform sampler2D u_texture0;

// tex1 
uniform sampler2D u_texture1;

out vec4 fragColor;

void main() {
    vec4 t0 = texture(u_texture0, v_texCoords); // screen
    vec4 t1 = texture(u_texture1, v_texCoords); // bloom

    t0 *= (vec4(1.0) - clamp(t1, vec4(0.0), vec4(1.0)));

    fragColor = t0 + t1;
}