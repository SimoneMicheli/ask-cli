const path = require('path');
const fs = require('fs');
const CONSTANTS = require('@src/utils/constants');
const CliError = require('@src/exceptions/cli-error');
const AbstractRunFlow = require('./abstract-run-flow');

class NodejsRunFlow extends AbstractRunFlow {
    static canHandle(runtime) {
        return runtime === CONSTANTS.RUNTIME.NODE;
    }

    constructor({ skillInvocationInfo, waitForAttach, debugPort, token, skillId, runRegion, watch }) {
        const skillFolderPath = path.join(process.cwd(), skillInvocationInfo.skillCodeFolderName);
        const script = path.join(skillFolderPath, CONSTANTS.RUN.NODE.SCRIPT_LOCATION);
        if (!fs.existsSync(script)) {
            throw new CliError('ask-sdk-local-debug cannot be found. Please install ask-sdk-local-debug to your skill code project. '
                + 'Refer https://www.npmjs.com/package/ask-sdk-local-debug for more info.');
        }
        const runtimeInfo = getRuntimeInfo(skillFolderPath, skillInvocationInfo.skillFileName, waitForAttach, debugPort);
        super({
            execMap: runtimeInfo.execMap,
            script,
            args: ['--accessToken', `"${token}"`, '--skillId', skillId,
                '--handlerName', skillInvocationInfo.handlerName,
                '--skillEntryFile', runtimeInfo.skillEntryFile,
                '--region', runRegion],
            watch: watch ? `${skillInvocationInfo.skillCodeFolderName}` : watch
        });
    }
}

function getRuntimeInfo(skillFolderPath, skillFileName, waitForAttach, debugPort) {
    const tsSkillEntryFile = path.join(skillFolderPath, `${skillFileName}.ts`);
    if (fs.existsSync(tsSkillEntryFile)) {
        console.log(`Found Typescript file at ${tsSkillEntryFile} use ts-node runtime`);
        return {
            skillEntryFile: tsSkillEntryFile,
            execMap: waitForAttach ? { js: `node -r ts-node/register --inspect-brk=${debugPort}` } : { js: 'node -r ts-node/register' }
        };
    }
    return {
        skillEntryFile: path.join(skillFolderPath, `${skillFileName}.js`),
        execMap: waitForAttach ? { js: `node --inspect-brk=${debugPort}` } : undefined
    };
}

module.exports = NodejsRunFlow;
