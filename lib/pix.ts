const PIX_GUI = "br.gov.bcb.pix";

export function createPixPayload(input: {
  amountCents: number;
  city?: string | null;
  merchantName: string;
  pixKey: string;
  txid: string;
}) {
  const payloadWithoutCrc = [
    tlv("00", "01"),
    tlv("26", [tlv("00", PIX_GUI), tlv("01", input.pixKey.trim())].join("")),
    tlv("52", "0000"),
    tlv("53", "986"),
    tlv("54", (input.amountCents / 100).toFixed(2)),
    tlv("58", "BR"),
    tlv("59", normalize(input.merchantName, 25) || "RECEBEDOR"),
    tlv("60", normalize(input.city || "BRASIL", 15) || "BRASIL"),
    tlv("62", tlv("05", normalizeTxid(input.txid))),
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`;
}

function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function normalize(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, maxLength)
    .toUpperCase();
}

function normalizeTxid(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
