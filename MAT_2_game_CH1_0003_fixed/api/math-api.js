const extData = {
    contentId: 'default-id',
    contentTag: {},
    contentName: '1_3',
};
globalThis['extData'] = extData;

window.addEventListener('message', (msg) => {
    console.log(`content message`);
    console.log(msg);

    if (msg.data.type === 'sendRestoreData') {
        extData.contentId = msg.data.contentId;
        extData.contentTag = msg.data.contentTag;
        
    }
})

function requestRestoreData() {
    const msg = {
        type: 'requestRestoreData'
    };
    window.parent.postMessage(msg, '*');
}

function postSizeMsg() {
    const cWidth = 840;
    const aspectRatio = 1280 / 720;
    const calHeight = cWidth / aspectRatio;

    const msg = {
        type: 'iframeCurrentPage',
        data: 1,
        height: calHeight
    };
    window.parent.postMessage(msg, '*');

    console.log(`iframeCurrentPage: `);
    console.log(msg);
}

requestRestoreData();
postSizeMsg();