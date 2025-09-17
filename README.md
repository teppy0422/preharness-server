npm run dev で API サーバー起動

:2025-07-25:
npm install -g nodemon

package.json に追記
"scripts": {
"start": "node app.js",
"dev": "nodemon app.js"
}

Success import from Flutter request.

copy 001 3.44MB

-now-

Split server login information into db.js

copy 013

import/test に ch のインポートを追加

copy 014

import/ch_list/search を追加
条件に Fhin(付属部品)を追加

copy 015

ch_list をインデックス検索に変更

copy 016

color_list のインポート追加

copy 017

gemini に削除されてた API の復元

copy 018

color_list を json で返す API の追加

copy 019

製造指示書.txt が shift_jis でもインポートできるようにする

### 2025-09-03

- port:3000 が使用済みならターミナルにエラー表示。

#### 001

- インポートファイル名の修正。rlgf29 -> rlg29

#### 002

- 実績保存テーブル作成の追加

#### 003

- 実績保存の処理を追加
- カラム machine_number を追加

#### 004
