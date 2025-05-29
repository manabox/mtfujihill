document.getElementById('generate').addEventListener('click', generateImage);

/**
 * document.fonts.load() を使ってフォントのロードを試み、
 * ダメなら check() でポーリングします。
 * @param {string} fontSpec - ロードするフォント指定 (例: "500 90px 'Zen Maru Gothic'")
 * @param {number} timeout - タイムアウトまでのミリ秒
 * @returns {Promise<void>}
 */
async function waitForFontSmart(fontSpec, timeout = 15000) {
    try {
        // document.fonts.load() を試す
        const loadedFonts = await document.fonts.load(fontSpec);
        if (loadedFonts.length > 0) {
            return; // 成功したら抜ける
        }
    } catch (err) {
        // load() でエラーが発生した場合は、下の check() ポーリングに移行
    }

    // --- load() が失敗/不確かな場合、check() でポーリング ---
    return new Promise((resolve, reject) => {
        const interval = 100;
        let elapsedTime = 0;

        const intervalId = setInterval(() => {
            if (document.fonts.check(fontSpec)) {
                clearInterval(intervalId);
                resolve();
            } else {
                elapsedTime += interval;
                if (elapsedTime >= timeout) {
                    clearInterval(intervalId);
                    reject(new Error(`フォント "${fontSpec}" のロードがタイムアウトしました。`));
                }
            }
        }, interval);
    });
}

/**
 * 選択されたテキストを画像に反映させて生成します。
 */
async function generateImage() {
    const waveText = document.getElementById('select-wave').value;
    const goalText = document.getElementById('select-goal').value;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const resultArea = document.getElementById('result');
    resultArea.innerHTML = '<p>画像を生成中です...</p>';

    const cssFontFamily = 'Zen Maru Gothic';
    const fontWeight = '500';
    const fontSpecToCheck = `${fontWeight} 90px "${cssFontFamily}"`;

    try {
        // フォントが利用可能になるまで待つ
        await waitForFontSmart(fontSpecToCheck);

    } catch (err) {
        console.error("フォントの準備中にエラー:", err); // 念のためエラーログは残しても良いかも
        alert("フォントの読み込みに失敗しました。ページを再読み込みするか、ネットワーク接続を確認してください。");
        resultArea.innerHTML = '<p>フォントの読み込みに失敗しました。</p>';
        return;
    }

    // わずかに待機 (レンダリングの安定化のため、残しておいても良い)
    await new Promise(resolve => setTimeout(resolve, 50));

    const img = new Image();
    img.src = 'assets/mtfuji-bg.jpg';

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseFont = `"${cssFontFamily}", sans-serif`;

        // テキスト1
        ctx.font = `${fontWeight} 90px ${baseFont}`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${waveText}スタート`, centerX, centerY - 200);

        // テキスト2
        ctx.font = `${fontWeight} 110px ${baseFont}`;
        ctx.fillStyle = '#000066';
        ctx.fillText(`${goalText}`, centerX, centerY - 5);

        // テキスト3
        ctx.font = `${fontWeight} 90px ${baseFont}`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`目指して頑張ります！`, centerX, centerY + 200);

        const dataURL = canvas.toDataURL('image/png');

        // X投稿用のテキストとURLを準備
        const tweetText = `富士ヒルに参加します！${waveText}スタートです！${goalText}目指して頑張ります！`;
        const tweetUrl = "https://manabox.github.io/mtfujihill/";
        const hashtags = "富士ヒル,Mt富士ヒルクライム";

        // Web Intent URL を作成
        const twitterIntentUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}&hashtags=${encodeURIComponent(hashtags)}`;

        resultArea.innerHTML = `
          <p>画像の生成完了！画像を長押しか右クリックで保存してください。</p>
          <img src="${dataURL}" alt="生成された画像">
          <a href="${twitterIntentUrl}" class="btn-x" target="_blank" rel="noopener noreferrer">
            Xに投稿する
          </a>
          <p class="small-text">※ Xに投稿するボタンを押した後、<br>保存した画像を投稿画面で添付してください。</p>
        `;
    };

    img.onerror = () => {
        console.error('背景画像の読み込みに失敗しました。パスを確認してください:', img.src);
        alert('背景画像の読み込みに失敗しました。\n`assets/mtfuji-bg.jpg` のパスが正しいか、ファイルが存在するか確認してください。');
        resultArea.innerHTML = '<p>背景画像の読み込みに失敗しました。</p>';
    };
}