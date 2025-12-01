const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLobbyCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[index];
  }
  return code;
}
