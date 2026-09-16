/** 조건부 className을 공백으로 잇는다. false·null·undefined·빈 문자열은 건너뛴다. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}
