// Enka.Network API — fetches a player's showcase characters by UID
// Docs: https://api.enka.network/#/api

const ENKA_BASE = 'https://enka.network/api';

export interface EnkaPlayerInfo {
  nickname: string;
  level: number;
  worldLevel: number;
  friendCount: number;
  signature: string;
  isDisplayAvatar: boolean;
}

export interface EnkaResponse {
  detailInfo: EnkaPlayerInfo;
  avatarDetailList?: EnkaAvatarDetail[];
  ttl: number; // seconds until cache expires
}

export interface EnkaAvatarDetail {
  avatarId: number;
  level: number;
  promotion: number;
  rank: number; // eidolons
  equipment?: EnkaEquipment;
  relicList?: EnkaRelic[];
  skillTreeList?: { pointId: number; level: number }[];
}

export interface EnkaEquipment {
  tid: number;
  rank: number; // superimposition
  level: number;
  promotion: number;
  flat: {
    name: string;
    setName?: string;
    stars: number;
    props: { type: string; value: number }[];
  };
}

export interface EnkaRelic {
  tid: number;
  type: number; // 1=Head, 2=Hands, 3=Body, 4=Feet, 5=Sphere, 6=Rope
  level: number;
  flat: {
    setName: string;
    setID: number;
    stars: number;
    props: { type: string; value: number }[];
  };
  mainAffixId: number;
  subAffixList?: { affixId: number; cnt: number; step: number }[];
}

export async function fetchPlayerData(uid: string): Promise<EnkaResponse> {
  const res = await fetch(`${ENKA_BASE}/hsr/uid/${uid}`);

  if (res.status === 404) throw new Error('Player not found. Check the UID and make sure their showcase is public.');
  if (res.status === 429) throw new Error('Rate limited by Enka.Network. Please wait a moment.');
  if (!res.ok)           throw new Error(`Enka API error: ${res.status}`);

  return res.json();
}
