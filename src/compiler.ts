import * as fs from "fs";
var solppc = require('@vite/solppc');

export async function compile(sourcePath: string) {
  let content = readSourceFile(sourcePath);

  const input = {
      language: 'Solidity',
      sources: {
        [sourcePath]: {content: content}
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['evm.bytecode', 'abi', 'evm.assembly']
          }
        }
      }
    };

    let output = JSON.parse(solppc.compile(JSON.stringify(input), { import: findImports }));
    // ignore 3805 warning (pre-release compiler)
    const filteredErrors = output.errors?.filter((err: any) => {return err.errorCode !== '3805'});

    let result: any = {};

    result['contracts'] = output.contracts || [];
    result['errors'] = filteredErrors || [] ;

    return result;
}

function readSourceFile(sourceName: string) {
  console.log('Compile source file:', sourceName);
  let content = fs.readFileSync(`${sourceName}`).toString();
  return content;
}

function findImports(path: string) {
  console.log('Find imports:', path);
  if (fs.existsSync(`${path}`))
      return {
          contents: readSourceFile(path) 
      };
  else return { error: 'File not found' };
}



