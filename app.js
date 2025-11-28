// app.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { pool, createClient } = require("./db");
// ディスク空き容量
const checkDiskSpace = require("check-disk-space").default;
// ユーザー登録
const multer = require("multer");

const app = express();
const port = process.env.PORT;

// ① POSTデータのパース
app.use(cors());
app.use(express.json());

// ② ここに追加（←この順番が重要）
const UPLOAD_DIR = process.env.UPLOAD_DIR;
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use("/uploads", express.static(UPLOAD_DIR)); //公開パス
app.get("/", (req, res) => {
  res.send("PreHarness API server is running");
});

app.post("/import", async (req, res) => {
  const INPUT_DIR = req.body.path_01;

  if (!INPUT_DIR || typeof INPUT_DIR !== "string") {
    return res.status(400).json({
      success: false,
      error: "filepath is required and must be a string",
    });
  }

  try {
    const files = fs
      .readdirSync(INPUT_DIR)
      .filter((file) => file.endsWith(".txt"));

    if (files.length === 0) {
      return res.json({
        success: true,
        code: 4,
        message: "No .txt files found.",
      });
    }

    const client = createClient();
    await client.connect();

    for (const file of files) {
      const filePath = path.join(INPUT_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.trim().split("\n");

      for (const line of lines) {
        const part_no = line.slice(0, 10).trim();
        const serial = line.slice(10, 20).trim();
        const code = line.slice(20, 30).trim();
        const flag = line.slice(30, 40).trim();

        await client.query(
          "INSERT INTO parts (part_no, serial, code, flag) VALUES ($1, $2, $3, $4)",
          [part_no, serial, code, flag]
        );
      }

      // bakフォルダ作成と移動処理
      const bakDir = path.join(INPUT_DIR, "bak");
      if (!fs.existsSync(bakDir)) fs.mkdirSync(bakDir);

      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, "")
        .slice(0, 15);
      const newFileName = `${path.basename(file, ".txt")}_${timestamp}.txt`;

      fs.renameSync(filePath, path.join(bakDir, newFileName));
    }

    await client.end();
    res.json({
      success: true,
      code: 0,
      message: `${files.length} file(s) imported.`,
    });
  } catch (error) {
    console.error("Error during import:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/import/test", async (req, res) => {
  const INPUT_DIR = req.body.path_01;

  if (!INPUT_DIR || typeof INPUT_DIR !== "string") {
    return res.status(400).json({
      success: false,
      error: "filepath is required and must be a string",
    });
  }

  try {
    const files = fs.readdirSync(INPUT_DIR).filter((file) => {
      const lowerCaseFile = file.toLowerCase();
      return (
        (lowerCaseFile.startsWith("kanban_") ||
          lowerCaseFile.startsWith("rlg29_") ||
          lowerCaseFile.startsWith("ch") ||
          lowerCaseFile.startsWith("color")) &&
        lowerCaseFile.endsWith(".txt")
      );
    });

    if (files.length === 0) {
      return res.json({
        success: true,
        code: 4,
        message: "No .txt files found.",
      });
    }

    const client = createClient();
    await client.connect();

    for (const file of files) {
      const lowerCaseFile = file.toLowerCase();
      const filePath = path.join(INPUT_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.trim().split("\n");

      if (
        lowerCaseFile.startsWith("kanban_") ||
        lowerCaseFile.startsWith("rlg29_")
      ) {
        for (const line of lines) {
          const no = line.slice(0, 4).trim();
          const delivery_month = line.slice(6, 8).trim();
          const cut_code = line.slice(8, 10).trim();
          const fumei_1 = line.slice(11, 19).trim();
          const lot_num = line.slice(19, 23).trim();
          const fumei_2 = line.slice(23, 27).trim();
          const fumei_3 = line.slice(27, 30).trim();
          const p_number = line.slice(30, 45).trim();
          const eng_change = line.slice(45, 48).trim();
          const cfg_no = line.slice(48, 52).trim();
          const wire_type = line.slice(52, 55).trim();
          const wire_size = line.slice(62, 65).trim();
          const wire_color = line.slice(67, 69).trim();
          const wire_len = line.slice(76, 80).trim();
          const circuit_1 = line.slice(80, 83).trim();
          const circuit_2 = line.slice(88, 91).trim();
          const term_proc_inst_1 = line.slice(96, 97).trim();
          const term_proc_inst_2 = line.slice(97, 98).trim();
          const mark_color_1 = line.slice(98, 100).trim();
          const mark_color_2 = line.slice(100, 102).trim();
          const strip_len_1 = line.slice(102, 105).trim();
          const strip_len_2 = line.slice(105, 108).trim();
          const term_part_no_1 = line.slice(108, 118).trim();
          const term_part_no_2 = line.slice(118, 128).trim();
          const add_parts_1 = line.slice(128, 138).trim();
          const add_parts_2 = line.slice(138, 148).trim();
          const wire_cnt = line.slice(148, 153).trim();
          const fumei_4 = line.slice(153, 160).trim();
          const delivery_date = line.slice(160, 166).trim();

          await client.query(
            `INSERT INTO m_processing_conditions (
      no, delivery_month, cut_code, fumei_1, lot_num, fumei_2, fumei_3,
      p_number, eng_change, cfg_no, wire_type, wire_size, wire_color, wire_len,
      circuit_1, circuit_2, term_proc_inst_1, term_proc_inst_2,
      mark_color_1, mark_color_2, strip_len_1, strip_len_2,
      term_part_no_1, term_part_no_2, add_parts_1, add_parts_2,wire_cnt,
      fumei_4, delivery_date
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18,
      $19, $20, $21, $22,
      $23, $24, $25, $26,
      $27, $28 ,$29
    )`,
            [
              no,
              delivery_month,
              cut_code,
              fumei_1,
              lot_num,
              fumei_2,
              fumei_3,
              p_number,
              eng_change,
              cfg_no,
              wire_type,
              wire_size,
              wire_color,
              wire_len,
              circuit_1,
              circuit_2,
              term_proc_inst_1,
              term_proc_inst_2,
              mark_color_1,
              mark_color_2,
              strip_len_1,
              strip_len_2,
              term_part_no_1,
              term_part_no_2,
              add_parts_1,
              add_parts_2,
              wire_cnt,
              fumei_4,
              delivery_date,
            ]
          );
        }
      } else if (lowerCaseFile.startsWith("ch")) {
        const allColumns = [
          "thin",
          "fhin",
          "hin1",
          "size1",
          "size1k",
          "size1f",
          "hin2",
          "size2",
          "size2k",
          "size2f",
          "hin3",
          "size3",
          "size3k",
          "size3f",
          "hin4",
          "size4",
          "size4k",
          "size4f",
          "sksiji",
          "skkp",
          "skkm",
          "chfc",
          "chfk",
          "chff",
          "chft",
          "chrc",
          "chrk",
          "chrf",
          "chrt",
          "cwff",
          "cwft",
          "cw1rf",
          "cw1rt",
          "cw2rf",
          "cw2rt",
          "kasimesp",
          "bff",
          "bft",
          "brf",
          "brt",
          "oem",
        ];
        const conflictColumns = [
          "thin",
          "fhin",
          "hin1",
          "size1",
          "size1k",
          "size1f",
          "hin2",
          "size2",
          "size2k",
          "size2f",
          "hin3",
          "size3",
          "size3k",
          "size3f",
          "hin4",
          "size4",
          "size4k",
          "size4f",
          "oem",
        ];
        const updateColumns = allColumns.filter(
          (c) => !conflictColumns.includes(c)
        );

        const insertClause = `INSERT INTO ch_list (${allColumns.join(", ")})`;
        const valuesClause = `VALUES (${Array.from(
          { length: 41 },
          (_, i) => `$${i + 1}`
        ).join(", ")})`;
        const conflictClause = `ON CONFLICT (${conflictColumns.join(", ")})`;
        const updateClause = `DO UPDATE SET ${updateColumns
          .map((c) => `${c} = EXCLUDED.${c}`)
          .join(", ")}, updated_at = NOW()`;
        const query = `${insertClause} ${valuesClause} ${conflictClause} ${updateClause}`;

        for (const line of lines) {
          const values = line.split(",").slice(1);
          if (values.length === 41) {
            await client.query(query, values);
          } else {
            console.warn(
              `Skipping line in ${file} due to incorrect number of values: ${line}`
            );
          }
        }
      } else if (lowerCaseFile.startsWith("color")) {
        const query = `
          INSERT INTO color_list (color_num, back_color_int, fore_color_int)
          VALUES ($1, $2, $3)
          ON CONFLICT (color_num)
          DO UPDATE SET
            back_color_int = EXCLUDED.back_color_int,
            fore_color_int = EXCLUDED.fore_color_int,
            updated_at = NOW()
        `;
        for (const line of lines) {
          const values = line.split(",").map((v) => v.trim());
          // color_num,back_color_int,fore_color_int の3つの値があると想定
          if (values.length === 3) {
            await client.query(query, values);
          } else {
            console.warn(
              `Skipping line in ${file} due to incorrect number of values: ${line}`
            );
          }
        }
      }

      // bakフォルダ作成と移動処理
      const bakDir = path.join(INPUT_DIR, "bak");
      if (!fs.existsSync(bakDir)) fs.mkdirSync(bakDir);

      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T]/g, "")
        .slice(0, 15);
      const newFileName = `${path.basename(file, ".txt")}_${timestamp}.txt`;

      fs.renameSync(filePath, path.join(bakDir, newFileName));
    }

    await client.end();
    res.json({
      success: true,
      code: 0,
      message: `${files.length} file(s) imported.`,
    });
  } catch (error) {
    console.error("Error during import:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// NasのステータスAPI
app.get("/api/ping", (req, res) => {
  res.sendStatus(200);
});
// Nasの空き容量API
app.get("/api/free-space", async (req, res) => {
  // 任意のパス（NASのマウントディレクトリなど）を指定
  const targetPath = "C:/"; // ここをNASの対象ディレクトリに変更！
  try {
    const diskSpace = await checkDiskSpace(targetPath);
    res.json({
      freeGB: (diskSpace.free / 1024 / 1024 / 1024).toFixed(2),
      totalGB: (diskSpace.size / 1024 / 1024 / 1024).toFixed(2),
    });
  } catch (error) {
    console.error("Failed to get disk space:", error);
    res.status(500).json({ error: error.message });
  }
});

// usersが無ければ作成する関数
async function ensureUsersTableExists() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `
    );

    const exists = res.rows[0].exists;

    if (!exists) {
      await client.query(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          iconname TEXT NOT NULL
        );
      `);
      console.log("🆕 users テーブルを新規作成しました");
    } else {
      console.log("✅ users テーブルは既に存在します");
    }
  } catch (err) {
    console.error("❌ users テーブル作成エラー:", err);
  } finally {
    client.release();
  }
}
// color_listが無ければ作成する関数
async function ensureColorListTableExists() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'color_list'
      );`
    );
    const exists = res.rows[0].exists;

    if (!exists) {
      await client.query(`
        CREATE TABLE color_list (
          color_num TEXT PRIMARY KEY,
          back_color_int TEXT NOT NULL,
          fore_color_int TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("🆕 color_list テーブルを新規作成しました");
    } else {
      console.log("✅ color_list テーブルは既に存在します");
      // 既存テーブルにupdated_atカラムがなければ追加
      const hasUpdatedAt = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='color_list' AND column_name='updated_at';
      `);
      if (hasUpdatedAt.rows.length === 0) {
        await client.query(
          `ALTER TABLE color_list ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();`
        );
        console.log("🆕 color_list テーブルに updated_at カラムを追加しました");
      }
    }
  } catch (err) {
    console.error("❌ color_list テーブル作成エラー:", err);
  } finally {
    client.release();
  }
}
// m_processing_conditionsが無ければ作成する関数
async function ensureMProcessingConditionsTableExists() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'm_processing_conditions'
      );
    `
    );

    const exists = res.rows[0].exists;

    if (!exists) {
      await client.query(
        `
        CREATE TABLE m_processing_conditions (
          id BIGSERIAL PRIMARY KEY,
          no TEXT,
          delivery_month TEXT,
          cut_code TEXT,
          fumei_1 TEXT,
          lot_num TEXT,
          fumei_2 TEXT,
          fumei_3 TEXT,
          p_number TEXT,
          eng_change TEXT,
          cfg_no TEXT,
          wire_type TEXT,
          wire_size TEXT,
          wire_color TEXT,
          wire_len TEXT,
          circuit_1 TEXT,
          circuit_2 TEXT,
          term_proc_inst_1 TEXT,
          term_proc_inst_2 TEXT,
          mark_color_1 TEXT,
          mark_color_2 TEXT,
          strip_len_1 TEXT,
          strip_len_2 TEXT,
          term_part_no_1 TEXT,
          term_part_no_2 TEXT,
          add_parts_1 TEXT,
          add_parts_2 TEXT,
          wire_cnt TEXT,
          fumei_4 TEXT,
          delivery_date TEXT,
          asm_code TEXT
        );
      `
      );
      console.log("🆕 m_processing_conditions テーブルを新規作成しました");
    } else {
      console.log("✅ m_processing_conditions テーブルは既に存在します");
    }
  } catch (err) {
    console.error("❌ m_processing_conditions テーブル作成エラー:", err);
  } finally {
    client.release();
  }
}
// テーブルch_listが無い場合に作成
async function ensureChListTableExists() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ch_list'
      );
    `
    );

    const exists = res.rows[0].exists;

    if (!exists) {
      await client.query(
        `
        CREATE TABLE ch_list (
          id BIGSERIAL PRIMARY KEY,
          thin   TEXT,
          fhin   TEXT,
          hin1   TEXT,
          size1  TEXT,
          size1k TEXT,
          size1f TEXT,
          hin2   TEXT,
          size2  TEXT,
          size2k TEXT,
          size2f TEXT,
          hin3   TEXT,
          size3  TEXT,
          size3k TEXT,
          size3f TEXT,
          hin4   TEXT,
          size4  TEXT,
          size4k TEXT,
          size4f TEXT,
          sksiji TEXT,
          skkp   TEXT,
          skkm   TEXT,
          chfc   TEXT,
          chfk   TEXT,
          chff   TEXT,
          chft   TEXT,
          chrc   TEXT,
          chrk   TEXT,
          chrf   TEXT,
          chrt   TEXT,
          cwff   TEXT,
          cwft   TEXT,
          cw1rf  TEXT,
          cw1rt  TEXT,
          cw2rf  TEXT,
          cw2rt  TEXT,
          kasimesp TEXT,
          bff    TEXT,
          bft    TEXT,
          brf    TEXT,
          brt    TEXT,
          oem    TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (thin, fhin, hin1, size1, size1k, size1f, hin2, size2, size2k, size2f, hin3, size3, size3k, size3f, hin4, size4, size4k, size4f, oem)
        );
      `
      );
      await client.query(
        `CREATE INDEX idx_ch_list_search ON ch_list (thin, fhin, hin1, size1);`
      );
      console.log("🆕 ch_list テーブルとインデックスを新規作成しました");
    } else {
      console.log("✅ ch_list テーブルは既に存在します");
    }
  } catch (err) {
    console.error("❌ ch_list テーブル作成エラー:", err);
  } finally {
    client.release();
  }
}

// ユーザー登録API
// ユーザー登録API（idはサーバー側で生成）
app.post("/api/register", async (req, res) => {
  const { username, iconname } = req.body;

  console.log("[register] username:", username);
  console.log("[register] iconname:", iconname);

  if (!username || !iconname) {
    return res
      .status(400)
      .json({ success: false, error: "ユーザー名とアイコンが必要です" });
  }

  try {
    const client = await pool.connect();
    console.log("[register] DB connected");

    // 空いている4桁の数字IDをランダムに生成
    let id;
    const maxAttempts = 10000;
    for (let i = 0; i < maxAttempts; i++) {
      const candidateId = String(Math.floor(1000 + Math.random() * 9000)); // 1000〜9999
      const checkResult = await client.query(
        "SELECT COUNT(*) FROM users WHERE id = $1",
        [candidateId]
      );
      if (parseInt(checkResult.rows[0].count) === 0) {
        id = candidateId;
        break;
      }
    }

    if (!id) {
      client.release();
      console.log("[register] ID generation failed");
      return res
        .status(500)
        .json({ success: false, error: "Failed to generate unique ID" });
    }

    console.log("[register] Generated ID:", id);

    await client.query(
      `INSERT INTO users (id, username, iconname) VALUES ($1, $2, $3)`,
      [id, username, iconname]
    );

    console.log("[register] Inserted into DB");

    client.release();

    res.json({
      success: true,
      message: "User registered",
      id,
      username,
    });
  } catch (error) {
    console.error("[register] DB Error:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ユーザー一覧API
app.get("/api/users", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT id, username, iconname FROM users"
    );
    client.release();
    const nasIp = req.headers.host.split(":")[0]; // 呼び出し元IP
    const users = result.rows.map((u) => ({
      id: u.id,
      username: u.username,
      iconname: u.iconname,
      nasIp, // Flutter側でNAS IPでアイコン画像取得用に使用
    }));
    res.json(users);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 使用済みアイコン取得API
app.get("/api/users/icons", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT iconname FROM users WHERE iconname IS NOT NULL"
    );
    const usedIcons = result.rows.map((row) => row.iconname);
    res.json(usedIcons);
  } catch (error) {
    console.error("[GET /api/users/icons] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// ユーザー個別取得API
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// ユーザー削除API
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM users WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error("ユーザー削除エラー:", err);
    res.status(500).json({ error: "DB削除エラー" });
  } finally {
    client.release();
  }
});

// ユーザー更新API
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, iconname } = req.body;

  if (!username) {
    return res
      .status(400)
      .json({ success: false, error: "ユーザー名が必要です" });
  }

  const client = await pool.connect();

  try {
    await client.query(
      "UPDATE users SET username = $1, iconname = $2 WHERE id = $3",
      [username, iconname, id]
    );

    res.json({ success: true, message: "ユーザー情報を更新しました" });
  } catch (error) {
    console.error("ユーザー更新エラー:", error);
    res.status(500).json({ success: false, error: "DB更新エラー" });
  } finally {
    client.release();
  }
});
// efuの検索API
app.get("/api/m_processing_conditions/search", async (req, res) => {
  const { p_number, cfg_no } = req.query; // クエリパラメータから取得

  if (!p_number || !cfg_no) {
    return res.status(400).json({ error: "p_number と cfg_no は必須です" });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM m_processing_conditions
       WHERE p_number = $1 AND cfg_no = $2`,
      [p_number, cfg_no]
    );
    client.release();

    res.json(result.rows);
  } catch (err) {
    console.error("m_processing_conditions 検索エラー:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ch_listの検索API
app.get("/api/ch_list/search", async (req, res) => {
  const { thin, fhin, hin1, size1 } = req.query;
  if (!thin || !fhin || !hin1 || !size1) {
    return res.status(400).json({
      error: "thin, fhin, hin1, and size1 are required query parameters",
    });
  }
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM ch_list WHERE thin = $1 AND fhin = $2 AND hin1 = $3 AND size1 = $4`,
      [thin, fhin, hin1, size1]
    );
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.log(thin, fhin, hin1, size1);
    console.error("ch_list search error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// color_listの取得API
app.get("/api/color_list", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT color_num, back_color_int, fore_color_int FROM color_list ORDER BY color_num"
    );
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error("color_list 取得エラー:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// work_results 登録API
app.post("/api/work_results", async (req, res) => {
  console.log("[work_results] Request received");
  console.log("[work_results] Request body:", req.body);

  const data = req.body;
  try {
    const client = await pool.connect();
    console.log("[work_results] DB connected");

    // 受け取ったデータから存在するキーと値を抽出
    const columns = Object.keys(data);
    const values = Object.values(data);

    console.log("[work_results] Columns:", columns);
    console.log("[work_results] Values:", values);

    // 動的にクエリを生成
    const query = `
      INSERT INTO work_results (${columns.join(", ")})
      VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})
      RETURNING id;
    `;

    console.log("[work_results] Generated query:", query);

    const result = await client.query(query, values);
    console.log("[work_results] Query executed successfully");

    client.release();

    res.status(201).json({
      success: true,
      message: "Work result saved successfully.",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("❌ [work_results] 登録エラー:", error);
    console.error("❌ [work_results] Error details:", error.message);
    console.error("❌ [work_results] Error stack:", error.stack);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// work_results 取得API
app.get("/api/work_results", async (req, res) => {
  console.log("[work_results] GET Request received");

  const { limit = 50, order = "desc" } = req.query;
  const limitValue = Math.min(parseInt(limit) || 50, 200); // 最大200件
  const orderValue = order === "asc" ? "ASC" : "DESC";

  try {
    const client = await pool.connect();
    console.log("[work_results] DB connected for GET");

    const query = `
      SELECT
        id, actual_count, average_speed,
        micrometer_serial_number,
        applicator_name, applicator_serial_number,
        terminal_name,terminal_serial_number,
        measured_front_ch,measured_back_ch,measured_front_cw,measured_back_cw,
        machine_type, machine_number, machine_serial,
        work_name, username, efu_lot_num, efu_p_number, efu_eng_change, efu_cfg_no,
        efu_sub_assy, efu_wire_type, efu_wire_size, efu_wire_color, efu_wire_len,
        efu_cut_code, efu_wire_cnt, efu_delivery_date, efu_save_completed,
        block_terminals_0, block_terminals_1, block_terminals_length, block_save_completed,
        created_at
      FROM work_results
      ORDER BY created_at ${orderValue}
      LIMIT $1
    `;

    console.log(
      "[work_results] Executing query with limit:",
      limitValue,
      "order:",
      orderValue
    );

    const result = await client.query(query, [limitValue]);
    client.release();

    console.log(`✅ [work_results] 取得成功: ${result.rows.length}件`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ [work_results] 取得エラー:", error);
    res.status(500).json({
      success: false,
      error: "作業実績の取得に失敗しました",
      details: error.message,
    });
  }
});

// work_results CSV出力API
app.post("/api/work_results/export", async (req, res) => {
  console.log("[work_results] CSV export request received");
  console.log("[work_results] Request body:", req.body);

  const { outputPath, format } = req.body;

  if (!outputPath) {
    console.error("❌ [work_results] outputPath is required");
    return res.status(400).json({
      success: false,
      error: "outputPath is required",
    });
  }

  const client = await pool.connect();
  try {
    console.log("[work_results] DB connected for CSV export");

    // 全work_resultsデータを取得
    const result = await client.query(`
      SELECT * FROM work_results
      ORDER BY created_at DESC
    `);

    console.log(
      `[work_results] Retrieved ${result.rows.length} records for CSV export`
    );

    // CSV生成
    const csvContent = generateWorkResultsCSV(result.rows);

    // ファイル名生成（日本時間）
    const japanTime = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const isoString = japanTime.toISOString();
    const datePart = isoString.substring(0, 10).replace(/-/g, ""); // YYYYMMDD
    const timePart = isoString.substring(11, 19).replace(/:/g, "-"); // HH_MM_SS
    const timestamp = `${datePart}_${timePart}`; // YYYYMMDD_HH_MM_SS
    const filename = `work_results_${timestamp}.csv`;

    // 出力先パス作成
    const fullPath = path.join(outputPath, filename);

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
      console.log(`[work_results] Created output directory: ${outputPath}`);
    }

    // CSVファイル書き込み
    await fs.promises.writeFile(fullPath, csvContent, "utf8");
    console.log(`✅ [work_results] CSV export successful: ${fullPath}`);

    res.json({
      success: true,
      message: "CSV出力が完了しました",
      filename: filename,
      path: fullPath,
      recordCount: result.rows.length,
    });
  } catch (error) {
    console.error("❌ [work_results] CSV export error:", error);
    res.status(500).json({
      success: false,
      error: "CSV出力に失敗しました",
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// CSV生成関数
function generateWorkResultsCSV(workResults) {
  // ヘッダー行（日本語表示名）
  const headers = [
    "準完日",
    "作業名",
    "ユーザー",
    "マイクロメーター",
    "アプリ品番",
    "アプリシリアル",
    "端子品番",
    "ロットNo",
    "前足CH",
    "後足CH",
    "前足CW",
    "後足CW",
    "実績数",
    "平均速度",
    "機種",
    "号機",
    "管理No",
    "ロット番号",
    "品番",
    "CFG No",
    "ワイヤータイプ",
    "ワイヤーサイズ",
    "ワイヤー色",
    "ワイヤー長",
    "ワイヤー本数",
    "端子1",
    "端子2",
    "端子長",
    "作業日時",
  ];

  // データ行生成
  const rows = workResults.map((row) => [
    formatDeliveryDateForCSV(row.efu_delivery_date), // 250729 → 2025/07/29
    row.work_name || "未設定",
    row.username || "未設定",
    row.micrometer_serial_number || "未設定",
    row.applicator_name || "未設定",
    row.applicator_serial_number || "未設定",
    row.terminal_name || "未設定",
    row.terminal_serial_number || "未設定",
    row.measured_front_ch || "未設定",
    row.measured_back_ch || "未設定",
    row.measured_front_cw || "未設定",
    row.measured_back_cw || "未設定",
    `${row.actual_count || 0}個`,
    `${(row.average_speed || 0).toFixed(1)}個/分`,
    row.machine_type || "未設定",
    row.machine_number || "未設定",
    row.machine_serial || "未設定",
    row.efu_lot_num || "未設定",
    row.efu_p_number || "未設定",
    row.efu_cfg_no || "未設定",
    row.efu_wire_type || "未設定",
    row.efu_wire_size || "未設定",
    row.efu_wire_color || "未設定",
    row.efu_wire_len || "未設定",
    row.efu_wire_cnt || "未設定",
    row.block_terminals_0 || "未設定",
    row.block_terminals_1 || "未設定",
    row.block_terminals_length || "未設定",
    formatDateTimeForCSV(row.created_at),
  ]);

  // CSV形式に変換
  const csvLines = [headers, ...rows].map((row) =>
    row.map((cell) => `"${cell}"`).join(",")
  );

  return csvLines.join("\n");
}

// 準完日フォーマット関数（サーバー側）
function formatDeliveryDateForCSV(deliveryDateStr) {
  if (!deliveryDateStr || deliveryDateStr === "未設定") {
    return "未設定";
  }

  try {
    // YYMMDD形式（6桁）の場合
    if (deliveryDateStr.length === 6) {
      const year = parseInt(deliveryDateStr.substring(0, 2));
      const month = deliveryDateStr.substring(2, 4);
      const day = deliveryDateStr.substring(4, 6);

      // 年の補正（2桁年 -> 4桁年）
      const fullYear = year < 50 ? 2000 + year : 1900 + year;

      return `${fullYear}/${month}/${day}`;
    }

    // YYYYMMDD形式（8桁）の場合
    if (deliveryDateStr.length === 8) {
      const year = deliveryDateStr.substring(0, 4);
      const month = deliveryDateStr.substring(4, 6);
      const day = deliveryDateStr.substring(6, 8);

      return `${year}/${month}/${day}`;
    }

    // その他の形式はそのまま表示
    return deliveryDateStr;
  } catch (e) {
    return deliveryDateStr;
  }
}

// 作業日時フォーマット関数（サーバー側）
function formatDateTimeForCSV(dateTimeStr) {
  if (!dateTimeStr) return "未設定";
  try {
    const dateTime = new Date(dateTimeStr);
    return dateTime.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateTimeStr;
  }
}

// work_resultsテーブルがなければ作成する関数
async function ensureWorkResultsTableExists() {
  const client = await pool.connect();
  try {
    // 期待されるカラム定義
    const expectedColumns = [
      { name: "id", type: "BIGSERIAL PRIMARY KEY" },
      { name: "actual_count", type: "INTEGER" },
      { name: "micrometer_serial_number", type: "TEXT" },
      { name: "applicator_name", type: "TEXT" },
      { name: "applicator_serial_number", type: "TEXT" },
      { name: "terminal_name", type: "TEXT" },
      { name: "terminal_serial_number", type: "TEXT" },
      { name: "average_speed", type: "REAL" },
      { name: "block_terminals_0", type: "TEXT" },
      { name: "block_terminals_1", type: "TEXT" },
      { name: "block_terminals_length", type: "TEXT" },
      { name: "block_save_completed", type: "TEXT" },
      { name: "efu_lot_num", type: "TEXT" },
      { name: "efu_p_number", type: "TEXT" },
      { name: "efu_eng_change", type: "TEXT" },
      { name: "efu_cfg_no", type: "TEXT" },
      { name: "efu_sub_assy", type: "TEXT" },
      { name: "efu_wire_type", type: "TEXT" },
      { name: "efu_wire_size", type: "TEXT" },
      { name: "efu_wire_color", type: "TEXT" },
      { name: "efu_wire_len", type: "TEXT" },
      { name: "efu_cut_code", type: "TEXT" },
      { name: "efu_wire_cnt", type: "TEXT" },
      { name: "efu_delivery_date", type: "TEXT" },
      { name: "efu_save_completed", type: "TEXT" },
      { name: "machine_type", type: "TEXT" },
      { name: "machine_number", type: "TEXT" },
      { name: "machine_serial", type: "TEXT" },
      { name: "measured_front_ch", type: "TEXT" },
      { name: "measured_back_ch", type: "TEXT" },
      { name: "measured_front_cw", type: "TEXT" },
      { name: "measured_back_cw", type: "TEXT" },
      { name: "work_name", type: "TEXT" },
      { name: "username", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    ];

    // テーブル存在チェック
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'work_results'
      );`
    );

    if (!tableExists.rows[0].exists) {
      // テーブルが存在しない場合は新規作成
      const createColumns = expectedColumns
        .map((col) => `${col.name} ${col.type}`)
        .join(", ");

      await client.query(`CREATE TABLE work_results (${createColumns});`);
      console.log("🆕 work_results テーブルを新規作成しました");
    } else {
      // テーブルが存在する場合はカラムチェック
      const existingColumns = await client.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = 'work_results' AND table_schema = 'public';`
      );

      const existingColumnNames = existingColumns.rows.map(
        (row) => row.column_name
      );

      // 不足カラムを検出（idは除外）
      const missingColumns = expectedColumns.filter(
        (col) => col.name !== "id" && !existingColumnNames.includes(col.name)
      );

      // 不足カラムを追加
      for (const missingCol of missingColumns) {
        await client.query(
          `ALTER TABLE work_results ADD COLUMN ${missingCol.name} ${missingCol.type};`
        );
        console.log(
          `🆕 work_results テーブルに ${missingCol.name} カラムを追加しました`
        );
      }

      if (missingColumns.length === 0) {
        console.log("✅ work_results テーブルは最新です");
      } else {
        console.log(
          `✅ work_results テーブルに ${missingColumns.length} 個のカラムを追加しました`
        );
      }
    }
  } catch (err) {
    console.error("❌ work_results テーブル作成/更新エラー:", err);
  } finally {
    client.release();
  }
}

// 起動
Promise.all([
  ensureUsersTableExists(),
  ensureMProcessingConditionsTableExists(),
  ensureChListTableExists(),
  ensureColorListTableExists(),
  ensureWorkResultsTableExists(),
]).then(() => {
  app.listen(port, "0.0.0.0", (err) => {
    if (err) {
      console.error("Server startup error:", err);
    } else {
      console.log(`Server running at http://0.0.0.0:${port}`);
    }
  });
});
