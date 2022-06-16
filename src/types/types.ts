/*
 Copy from @vite/vitejs/src/contract/index.ts:
*/
export const Vite_TokenId = 'tti_5649544520544f4b454e6e40';
export const Vite_Token_Info = {
    decimals: 18,
    tokenId: Vite_TokenId,
    tokenName: 'Vite Token',
    tokenSymbol: 'VITE'
};

export const VX_TokenId = 'tti_564954455820434f494e69b5';
export const VX_Token_Info = {
    decimals: 18,
    tokenId: VX_TokenId,
    tokenName: 'ViteX Coin',
    tokenSymbol: 'VX'
};
/*
  End of copy
*/

export enum ViteNetwork {
  Debug = "Debug",
  TestNet = "TestNet",
  MainNet = "MainNet",
}

export enum ViteNodeStatus {
  Syncing = "Syncing",
  Running = "Running",
  Stopped = "Stopped",
  Timeout = "Timeout",
}

export const CONTRACT_SCHEME = "contract";

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export interface ViteNode {
  name: string;
  url: string;
  network: ViteNetwork;
  status: ViteNodeStatus;
  version?: string;
  info?: any;
  error?: any;
}

export type Hex = string;
export type Address = string;

export interface AddressObj {
  publicKey: Hex;
  privateKey: Hex;
  originalAddress: Hex;
  address: Address;
  path: string;
}

export interface MessageEvent {
  command: string;
  subCommand?: string;
  message?: any;
}

export interface ABIAttr {
  type: string;
  name: string;
  internalType: string;
  indexed?: boolean;
  [key: string]: any;
}

export interface ABIItem {
  type: string;
  inputs?: ABIAttr[];
  outputs?: ABIAttr[];
  name?: string;
  stateMutability?: string;
  anonymous?: boolean;
  [key: string]: any;
}

export interface CompileResult {
  abi: ABIItem[];
  bytecode: string;
}

export interface DeployInfo {
  contractName: string;
  contractFsPath: string;
  sourceFsPath: string;
  abi: ABIItem[],
  network: ViteNetwork;
  address: Address;
}