struct VertexOut {
  @builtin(position) position : vec4f, // The position of the vertex in clip space
  @location(0) color : vec4f
}

// The vertex shader is called for each vertex in the vertex array.
// The vertex index is passed in as a builtin variable.
@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex : u32
) -> VertexOut
{

  // create data for a triangle
 let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );

  var output : VertexOut;
  output.position = vec4f(pos[vertexIndex].x, pos[vertexIndex].y, 0.0, 1.0);
  output.color = vec4f(1.0, 0.0, 0.0, 1.0);
  return output;
}

// The fragment shader is called for each pixel in the triangle.
@fragment
fn fragmentMain(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color; // final color of the pixel
}