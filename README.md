# スマイルチェッカー

画像に映っている人物が、スマイルかどうかを判定して結果を表示するアプリ

## 元情報

- [react-webcam + TypeScriptでカメラ撮影をしてみた（デモあり）](https://dev.classmethod.jp/articles/get-image-with-react-webcam-and-typescript/)
- [react-webcamで撮影した写真をAmazon Rekognitionで顔分析する](https://dev.classmethod.jp/articles/face-analysis-of-photos-taken-with-react-webcam-on-amazon-rekognition/)
- [Amazon Rekognitionでイメージの顔検出による感情分析を行う](https://dev.classmethod.jp/articles/emotion-analysis-with-face-detection-of-images-with-amazon-rekognition/)

React, Typescript, webcam, Amazon Rekognition での実装

### 注意事項
いずれも2021年の記事のため、現在の動きと異なる部分がある。
また、Node.js のバージョンも17系で記述してあるので、最新の18系からバージョンダウンして実装した


## できること
- 「カメラ ON」ボタンを押して、webcam のカメラ（動画）を表示する
    - この画像はローカルで表示するのみで、どこにも送信していない
- 「撮影」ボタンを押して、webcam のスナップショットを取得する
    - この画像はローカルで表示するのみで、どこにも送信していない
- 「削除」ボタンを押して、取得したスナップショットを削除する
- 「分析」ボタンを押して、Amazon Rekognition を呼び出して分析し、結果を表示する
    - この時、Amazon Rekognition へ画像データを送信する
    - 分析に利用した画像は、クラウド上に保存していない

## できないこと（やりたいこと）
- 同時にN人のデータを分析したい → 最大5人として対応
    - rekognizeResult.FaceDetails as FaceDetailList)[0]　で、ハードコーディングで0番目の要素しか見ていないが、要素があるだけ処理してほしい
    - 決め打ちで「同時に3人までできます」でもよい
        - 最悪、ハードコーディングで増やす
- 表示をもうちょっといい感じにしたい
    - 分析結果をA4で印刷して配布したい
    - 写真、スマイルかどうか、スマイルポイント（小数点以下1桁まで）、感情　がわかりやすく
- 検出した顔に、画像上に矩形を配置、何人目のデータかを表示したい
    - 複数人検出した場合、どれが誰のスコアかわからない
        - 顔の大きさ順らしい
