import * as vscode from 'vscode';
import { Ctx } from './ctx';

const completeItemList = [
  // keywords
  {
    label: "anonymous",
    insertText: "anonymous ",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "anonymous",
    insertText: "anonymous",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "as",
    insertText: "as",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "assembly",
    insertText: "assembly",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "break",
    insertText: "break",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "constant",
    insertText: "constant",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "constructor",
    insertText: "constructor",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "continue",
    insertText: "continue",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "contract",
    insertText: "contract",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "do",
    insertText: "do",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "else",
    insertText: "else",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "enum",
    insertText: "enum",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "emit",
    insertText: "emit",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "event",
    insertText: "event",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "external",
    insertText: "external",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "for",
    insertText: "for",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "function",
    insertText: "function",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "hex",
    insertText: "hex",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "if",
    insertText: "if",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "indexed",
    insertText: "indexed",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "interface",
    insertText: "interface",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "internal",
    insertText: "internal",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "import",
    insertText: "import",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "is",
    insertText: "is",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "library",
    insertText: "library",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "mapping",
    insertText: "mapping",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "memory",
    insertText: "memory",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "modifier",
    insertText: "modifier",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "new",
    insertText: "new",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "payable",
    insertText: "payable",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "public",
    insertText: "public",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "pragma",
    insertText: "pragma",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "soliditypp",
    insertText: "soliditypp",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "private",
    insertText: "private",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "pure",
    insertText: "pure",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "return",
    insertText: "return",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "returns",
    insertText: "returns",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "storage",
    insertText: "storage",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "calldata",
    insertText: "calldata",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "struct",
    insertText: "struct",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "throw",
    insertText: "throw",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "using",
    insertText: "using",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "var",
    insertText: "var",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "view",
    insertText: "view",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "while",
    insertText: "while",
    kind: vscode.CompletionItemKind.Keyword,
  },
  // units
  {
    label: "attov",
    insertText: "attov",
    kind: vscode.CompletionItemKind.Unit,
  },
  {
    label: "vite",
    insertText: "vite",
    kind: vscode.CompletionItemKind.Unit,
  },
  {
    label: "seconds",
    insertText: "seconds",
    kind: vscode.CompletionItemKind.Unit,
  },
  {
    label: "minutes",
    insertText: "minutes",
    kind: vscode.CompletionItemKind.Unit,
  },
  {
    label: "hours",
    insertText: "hours",
    kind: vscode.CompletionItemKind.Unit,
  },
  {
    label: "days",
    insertText: "days",
    kind: vscode.CompletionItemKind.Unit,
  },
  {
    label: "weeks",
    insertText: "weeks",
    kind: vscode.CompletionItemKind.Unit,
  },
  {
    label: "years",
    insertText: "years",
    kind: vscode.CompletionItemKind.Unit,
  },
  // types
  {
    label: "int",
    insertText: "int",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint",
    insertText: "uint",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes",
    insertText: "bytes",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "byte",
    insertText: "byte",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "string",
    insertText: "string",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "address",
    insertText: "address",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "vitetoken",
    insertText: "vitetoken",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bool",
    insertText: "bool",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "fixed",
    insertText: "fixed",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "ufixed",
    insertText: "ufixed",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int8",
    insertText: "int8",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int16",
    insertText: "int16",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int24",
    insertText: "int24",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int32",
    insertText: "int32",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int40",
    insertText: "int40",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int48",
    insertText: "int48",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int56",
    insertText: "int56",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int64",
    insertText: "int64",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int72",
    insertText: "int72",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int80",
    insertText: "int80",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int88",
    insertText: "int88",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int96",
    insertText: "int96",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int104",
    insertText: "int104",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int112",
    insertText: "int112",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int120",
    insertText: "int120",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int128",
    insertText: "int128",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int136",
    insertText: "int136",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int144",
    insertText: "int144",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int152",
    insertText: "int152",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int160",
    insertText: "int160",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int168",
    insertText: "int168",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int176",
    insertText: "int176",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int184",
    insertText: "int184",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int192",
    insertText: "int192",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int200",
    insertText: "int200",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int208",
    insertText: "int208",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int216",
    insertText: "int216",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int224",
    insertText: "int224",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int232",
    insertText: "int232",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int240",
    insertText: "int240",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int248",
    insertText: "int248",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "int256",
    insertText: "int256",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint8",
    insertText: "uint8",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint16",
    insertText: "uint16",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint24",
    insertText: "uint24",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint32",
    insertText: "uint32",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint40",
    insertText: "uint40",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint48",
    insertText: "uint48",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint56",
    insertText: "uint56",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint64",
    insertText: "uint64",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint72",
    insertText: "uint72",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint80",
    insertText: "uint80",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint88",
    insertText: "uint88",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint96",
    insertText: "uint96",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint104",
    insertText: "uint104",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint112",
    insertText: "uint112",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint120",
    insertText: "uint120",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint128",
    insertText: "uint128",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint136",
    insertText: "uint136",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint144",
    insertText: "uint144",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint152",
    insertText: "uint152",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint160",
    insertText: "uint160",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint168",
    insertText: "uint168",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint176",
    insertText: "uint176",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint184",
    insertText: "uint184",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint192",
    insertText: "uint192",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint200",
    insertText: "uint200",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint208",
    insertText: "uint208",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint216",
    insertText: "uint216",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint224",
    insertText: "uint224",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint232",
    insertText: "uint232",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint240",
    insertText: "uint240",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint248",
    insertText: "uint248",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "uint256",
    insertText: "uint256",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes1",
    insertText: "bytes1",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes2",
    insertText: "bytes2",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes3",
    insertText: "bytes3",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes4",
    insertText: "bytes4",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes5",
    insertText: "bytes5",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes6",
    insertText: "bytes6",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes7",
    insertText: "bytes7",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes8",
    insertText: "bytes8",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes9",
    insertText: "bytes9",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes10",
    insertText: "bytes10",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes11",
    insertText: "bytes11",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes12",
    insertText: "bytes12",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes13",
    insertText: "bytes13",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes14",
    insertText: "bytes14",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes15",
    insertText: "bytes15",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes16",
    insertText: "bytes16",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes17",
    insertText: "bytes17",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes18",
    insertText: "bytes18",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes19",
    insertText: "bytes19",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes20",
    insertText: "bytes20",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes21",
    insertText: "bytes21",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes22",
    insertText: "bytes22",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes23",
    insertText: "bytes23",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes24",
    insertText: "bytes24",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes25",
    insertText: "bytes25",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes26",
    insertText: "bytes26",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes27",
    insertText: "bytes27",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes28",
    insertText: "bytes28",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes29",
    insertText: "bytes29",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes30",
    insertText: "bytes30",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes31",
    insertText: "bytes31",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  {
    label: "bytes32",
    insertText: "bytes32",
    kind: vscode.CompletionItemKind.TypeParameter,
  },
  // values
  {
    label: "true",
    insertText: "true",
    kind: vscode.CompletionItemKind.Value,
  },
  {
    label: "false",
    insertText: "false",
    kind: vscode.CompletionItemKind.Value,
  },
  {
    label: "NULL",
    insertText: "NULL",
    kind: vscode.CompletionItemKind.Value,
  },
  // magic members
  {
    label: "msg",
    insertText: "msg",
    kind: vscode.CompletionItemKind.Variable,
  },
  {
    label: "sender",
    insertText: "sender",
    kind: vscode.CompletionItemKind.Field,
  },
  {
    label: "selector",
    insertText: "selector",
    kind: vscode.CompletionItemKind.Field,
  },
  {
    label: "transfer",
    insertText: "transfer",
    kind: vscode.CompletionItemKind.Method,
  },
  {
    label: "token",
    insertText: "token",
    kind: vscode.CompletionItemKind.Field,
  },
  {
    label: "value",
    insertText: "value",
    kind: vscode.CompletionItemKind.Field,
  },
  {
    label: "fromhash",
    insertText: "fromhash",
    kind: vscode.CompletionItemKind.Function,
  },
  {
    label: "accountheight",
    insertText: "accountheight",
    kind: vscode.CompletionItemKind.Function,
  },
  {
    label: "prevhash",
    insertText: "prevhash",
    kind: vscode.CompletionItemKind.Function,
  },
  {
    label: "random64",
    insertText: "random64",
    kind: vscode.CompletionItemKind.Function,
  },
  {
    label: "nextrandom",
    insertText: "nextrandom",
    kind: vscode.CompletionItemKind.Function,
  },
  {
    label: "balance",
    insertText: "balance",
    kind: vscode.CompletionItemKind.Function,
  },
  {
    label: "blake2b",
    insertText: "blake2b",
    kind: vscode.CompletionItemKind.Function,
  },
  {
    label: "keccak256",
    insertText: "keccak256",
    kind: vscode.CompletionItemKind.Function,
  },
  // reserved keywords
  {
    label: "await",
    insertText: "await",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "abstract",
    insertText: "abstract",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "after",
    insertText: "after",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "alias",
    insertText: "alias",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "apply",
    insertText: "apply",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "auto",
    insertText: "auto",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "case",
    insertText: "case",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "catch",
    insertText: "catch",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "copyof",
    insertText: "copyof",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "default",
    insertText: "default",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "define",
    insertText: "define",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "final",
    insertText: "final",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "immutable",
    insertText: "immutable",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "implements",
    insertText: "implements",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "in",
    insertText: "in",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "inline",
    insertText: "inline",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "let",
    insertText: "let",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "macro",
    insertText: "macro",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "match",
    insertText: "match",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "mutable",
    insertText: "mutable",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "null",
    insertText: "null",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "of",
    insertText: "of",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "override",
    insertText: "override",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "partial",
    insertText: "partial",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "promise",
    insertText: "promise",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "reference",
    insertText: "reference",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "relocatable",
    insertText: "relocatable",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "revert",
    insertText: "revert",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "sealed",
    insertText: "sealed",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "sizeof",
    insertText: "sizeof",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "static",
    insertText: "static",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "supports",
    insertText: "supports",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "switch",
    insertText: "switch",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "try",
    insertText: "try",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "type",
    insertText: "type",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "typedef",
    insertText: "typedef",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "typeof",
    insertText: "typeof",
    kind: vscode.CompletionItemKind.Keyword,
  },
  {
    label: "unchecked",
    insertText: "unchecked",
    kind: vscode.CompletionItemKind.Keyword,
  },
];

export function activateCompleteProvider(ctx: Ctx): void {
  ctx.pushCleanup(
    vscode.languages.registerCompletionItemProvider("soliditypp", {
      provideCompletionItems() {
        return completeItemList;
      }
    })
  );
}