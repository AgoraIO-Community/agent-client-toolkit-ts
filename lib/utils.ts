export function decodeStreamMessage(stream: Uint8Array) {
  const decoder = new TextDecoder();
  return decoder.decode(stream);
}

export const genTranceID = (length: number = 8) => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }

  return result;
};
