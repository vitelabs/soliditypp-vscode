/*
  define some types and interfaces
*/

export enum ViteNetwork {
  DebugNet = "DebugNet",
  TestNet = "TestNet",
  MainNet = "MainNet",
  Bridge = "Bridge",
}

export enum ViteNodeStatus {
  Syncing = "Syncing",
  Running = "Running",
  Stopped = "Stopped",
  Timeout = "Timeout",
  Connected = "Connected",
  Disconnected = "Disconnected",
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
  backendNetwork?: ViteNetwork;
  status: ViteNodeStatus;
  isDefault?: boolean;
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