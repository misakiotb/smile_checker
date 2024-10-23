import React from 'react';
import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { makeStyles } from "@material-ui/core/styles";
import {
  DetectFacesRequest,
  DetectFacesResponse,
  FaceDetailList,
  Emotions,
  Emotion,
} from "aws-sdk/clients/rekognition";
import AWS from "aws-sdk";
import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;

const useStyles = makeStyles(() => ({
  webcam: {
    top: "0px",
    left: "0px",
  },
  rekognizeResult: {
    flex: 1,
    top: "0px",
    left: "0px",
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
}));

const videoConstraints = {
  width: 720,
  height: 360,
  facingMode: "user",
};

// AWS.config
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION,
});

// Amazon Rekognition クライアント
const rekognitionClient = new AWS.Rekognition({
  apiVersion: "2016-06-27",
});

//Amazon Rekognitionによる顔分析
const detectFaces = async (imageData: string): Promise<DetectFacesResponse> => {
  const params: DetectFacesRequest = {
    Image: {
      Bytes: Buffer.from(
        imageData.replace("data:image/jpeg;base64,", ""),
        "base64"
      ),
    },
    Attributes: ["ALL"],
  };
  return await rekognitionClient.detectFaces(params).promise();
};

//分析結果からConfidence（分析結果の信頼度）取得
const getConfidence = (rekognizeResult: DetectFacesResponse): number => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[0]) {
    return (rekognizeResult.FaceDetails as FaceDetailList)[0].Confidence!;
  } else {
    return 0;
  }
};

//分析結果からSmile（笑っているか）取得
const getIsSmiling = (rekognizeResult: DetectFacesResponse): string => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[0]) {
      const isSmile = (rekognizeResult.FaceDetails as FaceDetailList)[0].Smile?.Value!;
    if (isSmile) {
      return "ナイス　スマイル！";
    } else {
      return "ノー　スマイル";
    }
  } else {
    return "";
  }
};


//分析結果からSmile（笑っているか）の信頼度を取得
const getIsSmilingConfidence = (rekognizeResult: DetectFacesResponse): number => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[0]) {
    return (rekognizeResult.FaceDetails as FaceDetailList)[0].Smile?.Confidence!;
  } else {
    return 0;
  }
};


//分析結果から感情を推定
const getEmotion = (rekognizeResult: DetectFacesResponse): string => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[0]) {
    const emotions = (rekognizeResult.FaceDetails as FaceDetailList)[0]
    .Emotions as Emotions;
    const largestEmotionConfidence = Math.max(
      ...(emotions.map((d) => d.Confidence) as number[])
    );
    const emotion = emotions.find(
      (d) => d.Confidence === largestEmotionConfidence
    ) as Emotion;
    return emotion.Type as string;
  } else {
    return "";
  }
};


function App() {
  const classes = useStyles();

  const [isCaptureEnable, setCaptureEnable] = useState<boolean>(false);
  const webcamRef = useRef<Webcam>(null);
  const [url, setUrl] = useState<string | null>(null);
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setUrl(imageSrc);
      setRekognizeResult(undefined);
    }
  }, [webcamRef]);

  const [rekognizeResult, setRekognizeResult] = useState<DetectFacesResponse>();
  const rekognizeHandler = async () => {
    const result: DetectFacesResponse = await detectFaces(url as string);
    setRekognizeResult(result);
    console.log(result);
  };

  return (
    <>
      <header>
        <h1>スマイルチェッカー:SMILE CHECKER</h1>
      </header>
      {isCaptureEnable || (
        <button onClick={() => setCaptureEnable(true)}>カメラ ON</button>
      )}
      {isCaptureEnable && (
        <>
          <div>
            <button onClick={() => setCaptureEnable(false)}>カメラ OFF</button>
          </div>
          <div>
            <Webcam
              audio={false}
              width={540}
              height={360}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className={classes.webcam}
            />
          </div>
          <button onClick={capture}>撮影！</button>
        </>
      )}
      {url && (
        <>
          <div>
            <button
              onClick={() => {
                setUrl(null);
                setRekognizeResult(undefined);
              }}
            >
              削除
            </button>
            <button onClick={() => rekognizeHandler()}>分析</button>
          </div>
          <div>
            <img src={url} alt="Screenshot" />
          </div>
          {typeof rekognizeResult !== "undefined" && (
            <div className={classes.rekognizeResult}>
              <table>
                <tr>
                  <th>No.</th>
                  <th>スマイル</th>
                  <th>スマイルポイント</th>
                  <th>感情</th>
                  <th>分析の信頼度</th>
                </tr>
                <tr>
                  <td>1人目</td>
                  <td>{getIsSmiling(rekognizeResult)}</td>
                  <td>{getIsSmilingConfidence(rekognizeResult)}</td>
                  <td>{getEmotion(rekognizeResult)}</td>
                  <td>{getConfidence(rekognizeResult)}</td>
                </tr>
                <tr>
                  <td>2人目</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>3人目</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </table>
              <div>
                <h3>感情の種類</h3>
                <div>
                  <ul>
                    <li>HAPPY : しあわせ</li>
                    <li>SURPRISED : おどろき</li>
                    <li>CONFUSED : こまった</li>
                    <li>ANGRY : おこった</li>
                    <li>DISGUSTED : うんざり</li>
                    <li>CALM : おだやか</li>
                    <li>FEAR : こわい</li>
                    <li>SAD : かなしい</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default App;
