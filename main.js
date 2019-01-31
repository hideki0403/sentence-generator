// markovchain
// @hideki_0403
const fs = require("fs")
const Mecab = require("mecab-lite")
const mecab = new Mecab()
mecab.ENCODING = "UTF-8"
var dictionaly = JSON.parse(fs.readFileSync("./dictionaly.db"))
const twitter = require("twitter")
const client = new twitter(JSON.parse(fs.readFileSync("./secret.json", "utf-8")))


client.stream('statuses/sample', function (stream) {
        stream.on('data', function (tweet) {
            if (tweet.in_reply_to_status_id === null) {
                if(!tweet.text.match(/RT|#|http|@/)) {
                    if(tweet.user.lang === "ja") {
                        if (tweet.source.match(/Twitter Web Client|Twitter for Android|Twitter for iPhone|Twitter for iPad/)) {
                            console.log("match: " + tweet.text)
                            learning(tweet.text)
                        }
                    }
                }
            }
        });
        stream.on('error', function (error) {
            console.log(error);
        });
})



// デバッグ用 辞書を読み込ませないとき以外はコメントアウト推奨
//dictionaly["!SOS"] = []


// 形態素解析して辞書生成
function learning(text) {
    mecab.wakatigaki(text, function (err, result) {
        if (err) throw err
        console.log(result)

        // 始端だった場合はその単語を登録
        var tmp = dictionaly["!SOS"]
        tmp.push(result[0])
        dictionaly["!SOS"] = tmp

        for (var i = 0; result.length > i; i++) {
            // その単語が辞書に登録されているか否か
            // されていなかったら辞書登録を済ませる
            if (dictionaly[result[i]] === undefined) {
                dictionaly[result[i]] = []
            }

            // 本処理
            if (result[i + 1] === undefined) {
                // 終端だった場合
                var tmp = dictionaly[result[i]]
                tmp.push("!EOS")
                dictionaly[result[i]] = tmp
                // 辞書ファイル保存する
                fs.writeFileSync('./dictionaly.db', JSON.stringify(dictionaly, null, '  '))
            } else {
                // 始端でも終端でもなかった場合
                var tmp = dictionaly[result[i]]
                tmp.push(result[i + 1])
                dictionaly[result[i]] = tmp
            }
        }
    })
}

// 文章生成
function markovchain() {
    var textbox = []
    var pre = dictionaly["!SOS"]
    var temp = pre[Math.floor(Math.random() * pre.length)]
    textbox.push(temp)
    while(true) {
        var textCd = dictionaly[temp]
        var temp = textCd[Math.floor(Math.random() * textCd.length)]
        if(temp !== "!EOS") {
            textbox.push(temp)
        } else {
            break
        }
    }
    return(textbox.join(""))
}

console.log(markovchain())