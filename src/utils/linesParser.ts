import * as os from 'os';
type keyWordsType =
    | 'bin'
    | 'offBin'
    | 'abi'
    | 'asm'
    | 'offAsm'
    | 'stoper'
    | 'name';
const keyWords: { matcher: RegExp; name: keyWordsType }[] = [
    {
        matcher: /^Binary:/,
        name: 'bin'
    },
    {
        matcher: /^OffChain Binary:/,
        name: 'offBin'
    },
    {
        matcher: /^Contract JSON ABI/,
        name: 'abi'
    },
    {
        matcher: /^EVM assembly:/,
        name: 'asm'
    },
    {
        matcher: /^Offchain assembly:/,
        name: 'offAsm'
    },
    {
        matcher: /======= .+:(.+) =======/,
        name: 'name'
    },
    {
        matcher: /^=======/,
        name: 'stoper'
    }
];
export function linesParser(lines: string[]) {
    const parser: {
        pos: number;
        curType: null | keyWordsType;
        curContent: string;
        end: number;
    } = {
        pos: 0,
        curType: null,
        curContent: '',
        end: lines.length - 1
    };
    const result: Partial<Record<keyWordsType, string[]>> = {};
    while (true) {
        const line = lines[parser.pos];
        const keyType = keyWords.find(key => key.matcher.test(line));
        /** save token */
        if (keyType || parser.pos > parser.end) {
            if (parser.curType) {
                result[parser.curType] = result[parser.curType] || [];
                result[parser.curType]?.push(parser.curContent);
                parser.curContent = '';
                parser.curType = null;
            }
        }
        /**last line */
        if (parser.pos > parser.end) {
            break;
        }
        if (!keyType) {
            parser.curContent += os.EOL + line || '';
            parser.pos++;
            continue;
        }

        if (keyType?.name === 'stoper') {
            parser.pos++;
            continue;
        }
        if (keyType?.name === 'name') {
            parser.curContent +=
                os.EOL + line.match(keyType.matcher)?.[1] || '';
            parser.curType = 'name';
            parser.pos++;
            continue;
        }
        if (keyType?.name === 'asm' || keyType?.name === 'offAsm') {
            parser.curType = keyType?.name;
            parser.pos = parser.pos + 2;
            continue;
        }
        parser.curType = keyType?.name;
        parser.pos++;
    }
    return result;
}
