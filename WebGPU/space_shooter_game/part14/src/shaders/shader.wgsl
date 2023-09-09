struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) texCoords: vec2f,
    @location(1) color: vec4f,
}

@group(0) @binding(0)
var<uniform> projectionViewMatrix: mat4x4f;

@vertex 
fn vertexMain(
    @location(0) pos: vec2f,  // xy
    @location(1) texCoords: vec2f, // uv
    @location(2) color: vec3f,  // rgb
) -> VertexOut 
{ 
   
    var output : VertexOut; 

    output.position = projectionViewMatrix * vec4f(pos, 0.0, 1.0);
    output.texCoords = texCoords;
    output.color = vec4f(color, 1.0);

    return output;
}

@group(1) @binding(0)
var texSampler: sampler;

@group(1) @binding(1)
var tex: texture_2d<f32>;


@fragment
fn fragmentMain(fragData: VertexOut ) -> @location(0) vec4f 
{
    var textureColor = textureSample(tex, texSampler, fragData.texCoords);
    return fragData.color * textureColor;
}
