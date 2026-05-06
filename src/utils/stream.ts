export async function* streamToGenerator(
  stream: ReadableStream<Uint8Array>,
  encoding: string = 'utf-8',
): AsyncGenerator<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder(encoding)
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      yield decoder.decode(value, { stream: true })
    }
  } catch (error) {
    reader.releaseLock()
  }
}

export function generatorToStream(gen: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await gen.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(encoder.encode(value))
      }
    },
  })
}

export async function* mockStream(
  text: string,
  delay: number = 50,
): AsyncGenerator<string> {
  for (const char of text) {
    yield char
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}
