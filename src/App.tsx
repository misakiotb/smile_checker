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
import { Collapse } from '@material-ui/core';

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
  resulttable:{
    margin: "20px",
    borderCollapse: "collapse",
    border: "5px solid #ddd",
  },
  resulttableth:{
    padding: "8px",
    textAlign: "center",
    border: "2px solid #ddd",
  },
  resulttabletd:{
    padding: "8px",
    textAlign: "center",
    border: "2px solid #ddd",
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
const getConfidence = (rekognizeResult: DetectFacesResponse, num: number): number => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[num]) {
    return Number((rekognizeResult.FaceDetails as FaceDetailList)[num].Confidence!.toFixed(1));
  } else {
    return 0;
  }
};

//分析結果からSmile（笑っているか）取得
const getIsSmiling = (rekognizeResult: DetectFacesResponse, num: number): string => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[num]) {
      const isSmile = (rekognizeResult.FaceDetails as FaceDetailList)[num].Smile?.Value!;
    if (isSmile) {
      return "☺ナイス スマイル☺";
    } else {
      return "スマイルがたりないよ！";
    }
  } else {
    return "－";
  }
};


//分析結果からSmile（笑っているか）の信頼度を取得
const getIsSmilingConfidence = (rekognizeResult: DetectFacesResponse, num: number): number => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[num]) {
    const isSmile = (rekognizeResult.FaceDetails as FaceDetailList)[num].Smile?.Value!;
    if (isSmile) {
      return Number((rekognizeResult.FaceDetails as FaceDetailList)[num].Smile?.Confidence!.toFixed(1));
    }
  }
  return 0;
};


//分析結果から感情を推定
const getEmotion = (rekognizeResult: DetectFacesResponse, num: number): string => {
  if ((rekognizeResult.FaceDetails as FaceDetailList)[num]) {
    const emotions = (rekognizeResult.FaceDetails as FaceDetailList)[num]
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
        <h1>スマイルチェッカー Smile Checker v1.0</h1>
        <h3>～みんな えがおに なれるかな？～</h3>
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
              <table className={classes.resulttable}>
                <tr>
                  <th className={classes.resulttableth}>No.</th>
                  <th className={classes.resulttableth}>スマイル</th>
                  <th className={classes.resulttableth}>スマイルポイント</th>
                  <th className={classes.resulttableth}>感情</th>
                </tr>
                <tr>
                  <td className={classes.resulttabletd}>1人目</td>
                  <td className={classes.resulttabletd}>{getIsSmiling(rekognizeResult,0)}</td>
                  <td className={classes.resulttabletd}>{getIsSmilingConfidence(rekognizeResult,0)}</td>
                  <td className={classes.resulttabletd}>{getEmotion(rekognizeResult,0)}</td>
                </tr>
                <tr>
                  <td className={classes.resulttabletd}>2人目</td>
                  <td className={classes.resulttabletd}>{getIsSmiling(rekognizeResult,1)}</td>
                  <td className={classes.resulttabletd}>{getIsSmilingConfidence(rekognizeResult,1)}</td>
                  <td className={classes.resulttabletd}>{getEmotion(rekognizeResult,1)}</td>
                </tr>
                <tr>
                  <td className={classes.resulttabletd}>3人目</td>
                  <td className={classes.resulttabletd}>{getIsSmiling(rekognizeResult,2)}</td>
                  <td className={classes.resulttabletd}>{getIsSmilingConfidence(rekognizeResult,2)}</td>
                  <td className={classes.resulttabletd}>{getEmotion(rekognizeResult,2)}</td>
                </tr>
                <tr>
                  <td className={classes.resulttabletd}>4人目</td>
                  <td className={classes.resulttabletd}>{getIsSmiling(rekognizeResult,3)}</td>
                  <td className={classes.resulttabletd}>{getIsSmilingConfidence(rekognizeResult,3)}</td>
                  <td className={classes.resulttabletd}>{getEmotion(rekognizeResult,3)}</td>
                </tr>
                <tr>
                  <td className={classes.resulttabletd}>5人目</td>
                  <td className={classes.resulttabletd}>{getIsSmiling(rekognizeResult,4)}</td>
                  <td className={classes.resulttabletd}>{getIsSmilingConfidence(rekognizeResult,4)}</td>
                  <td className={classes.resulttabletd}>{getEmotion(rekognizeResult,4)}</td>
                </tr>
              </table>
              <div>
                <h3>感情分析の種類</h3>
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
                  <div>AI（えーあい）が分析した感情はどうだったかな？</div>
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
