struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) texCoords: vec2f
}

@vertex 
fn vertexMain(
    @location(0) pos: vec2f,  // xy
    @location(1) texCoords: vec2f, // uv
) -> VertexOut 
{ 
   
    var output : VertexOut; 

    output.position = vec4f(pos, 0.0, 1.0);
    output.texCoords = texCoords;

    return output;
}

// this is our scene texture
@group(0) @binding(0)
var texSampler0: sampler;

@group(0) @binding(1)
var tex0: texture_2d<f32>;

// this is our bloom texture
@group(1) @binding(0)
var texSampler1: sampler;

@group(1) @binding(1)
var tex1: texture_2d<f32>;


@fragment
fn fragmentMain(fragData: VertexOut ) -> @location(0) vec4f 
{
    var screenTexture = textureSample(tex0, texSampler0, fragData.texCoords);
    var bloomTexture = textureSample(tex1, texSampler1, fragData.texCoords);

    // TODO: dampen

    return vec4f(screenTexture + bloomTexture, 1.0);
}