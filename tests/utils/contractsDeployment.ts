import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { CodePromise } from "@polkadot/api-contract";
import { contracts as externalContracts } from "../externalContracts/contracts.json";
import {
  _genValidGasLimitAndValue,
  _signAndSend,
} from "@727-ventures/typechain-types";
import type { WeightV2 } from "@polkadot/types/interfaces";
import fs from "fs";
import path from "path";

interface FileContent {
  fileName: string;
  content: any;
}

export async function deployExternalContracts(
  api: ApiPromise,
  keyring: Keyring
) {
  try {
    let contractsNames = Object.keys(externalContracts);
    let contractsFiles = readContractsFiles(
      "../externalContracts",
      contractsNames
    );

    const deploymentPromises = contractsFiles.map(async (contractFile) => {
      const { fileName: contractName, content: contract } = contractFile;
      const { constructorName, constructorArgs, value } =
        externalContracts[contractName];

      const contractAddress = await deployContract(
        api,
        keyring,
        contract,
        constructorName,
        constructorArgs,
        value
      );

      return {
        [contractName]: {
          name: contractName,
          address: contractAddress,
          abi: contract,
        },
      };
    });

    const deployedContracts = Object.assign(
      {},
      ...(await Promise.all(deploymentPromises))
    );

    return deployedContracts;
  } catch (error) {
    throw new Error("Failed to deploy external contracts");
  }
}

function readContractsFiles(
  folderPath: string,
  contractsNames: string[]
): FileContent[] {
  const dirPath = path.join(__dirname, ".", folderPath);
  const fileArray: FileContent[] = [];

  contractsNames.forEach((fileName: string) => {
    const filePath = `${dirPath}/${fileName}`;

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const jsonContent = JSON.parse(fileContent);
      const fileData: FileContent = {
        fileName,
        content: jsonContent,
      };
      fileArray.push(fileData);
    } catch (error) {
      console.error(`Error reading file ${fileName}:`, error);
      return [];
    }
  });

  return fileArray;
}

async function deployContract(
  api: ApiPromise,
  keyring: Keyring,
  contract: any,
  constructorName: string,
  constructorArgs: unknown[],
  value: any
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const alice = keyring.addFromUri("//Alice");

    const code = new CodePromise(api, contract, contract.source.wasm);

    const gasLimit = (await _genValidGasLimitAndValue(api, undefined))
      .gasLimit as WeightV2;
    const storageDepositLimit = undefined;

    const args = constructorArgs.length > 0 ? constructorArgs : [];

    let tx;
    try {
      tx = code.tx[constructorName]!(
        {
          gasLimit,
          storageDepositLimit,
          value: value,
        },
        ...args
      );
    } catch (error) {
      reject();
    }

    let response;
    try {
      response = await _signAndSend(
        api.registry,
        tx,
        alice,
        (event: any) => event
      );
    } catch (error) {
      reject();
    }

    if (response != undefined) {
      resolve(response.result.contract.address.toString());
    }
    reject();
  });
}
