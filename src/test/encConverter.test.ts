import * as assert from 'assert';
import { createEncConverter } from '../encConverter';

// Performs encoding checks using DICOM spec sppendix H to K
// http://dicom.nema.org/dicom/2013/output/chtml/part05/PS3.5.html

suite('createEndConverter', function() {
  const encodeToBuffer = (str: string) => {
    const replaced = str
      .replace(/\#.*$/gm, '')
      .replace(/(\d\d)\/(\d\d)/g, (m, p1, p2) =>
        String.fromCharCode((parseInt(p1) << 4) + parseInt(p2))
      )
      .replace(/0x([0-9a-f]{2})/g, (m, p) =>
        String.fromCharCode(parseInt(p, 16))
      )
      .replace(/\s+/g, '');
    return Buffer.from(replaced, 'binary');
  };

  test('H: Japanese example 1', async function() {
    const ec = await createEncConverter('\\ISO 2022 IR 87');
    const buf = encodeToBuffer(`
      05/09 06/01 06/13 06/01 06/04 06/01  # Yamada
      05/14                                # ^
      05/04 06/01 07/02 06/15 07/05        # Tarou
      03/13                                # =
      01/11 02/04 04/02                    # ESC $ B
      03/11 03/03 04/05 04/04              # 山田
      01/11 02/08 04/02                    # ESC ( B
      05/14                                # ^
      01/11 02/04 04/02                    # ESC $ B
      04/02 04/00 04/15 03/10              # 太郎
      01/11 02/08 04/02                    # ESC ( B
      03/13                                # =
      01/11 02/04 04/02                    # ESC $ B
      02/04 06/04 02/04 05/14 02/04 04/00  # やまだ
      01/11 02/08 04/02                    # ESC ( B
      05/14                                # ^
      01/11 02/04 04/02                    # ESC $ B
      02/04 03/15 02/04 06/13 02/04 02/06  # たろう
      01/11 02/08 04/02                    # ESC ( B
    `);
    const result = ec!(buf, 'PN');
    assert.equal(result, 'Yamada^Tarou=山田^太郎=やまだ^たろう');
  });

  // Failing
  test.skip('H: Japanese example 2', async function() {
    const ec = await createEncConverter('ISO 2022 IR 13\\ISO 2022 IR 87');
    const buf = encodeToBuffer(`
      13/04 12/15 12/00 13/14              # ﾔﾏﾀﾞ
      05/14                                # ^
      12/00 13/11 11/03                    # ﾀﾛｳ
      03/13                                # =
      01/11 02/04 04/02                    # ESC $ B
      03/11 03/03 04/05 04/04              # 山田
      01/11 02/08 04/10                    # ESC ( J
      05/14                                # ^
      01/11 02/04 04/02                    # ESC $ B
      04/02 04/00 04/15 03/10              # 太郎
      01/11 02/08 04/10                    # ESC ( J
      03/13                                # =
      01/11 02/04 04/02                    # ESC $ B
      02/04 06/04 02/04 05/14 02/04 04/00  # やまだ
      01/11 02/08 04/10                    # ESC ( J
      05/14                                # ^
      01/11 02/04 04/02                    # ESC $ B
      02/04 03/15 02/04 06/13 02/04 02/06  # たろう
      01/11 02/08 04/10                    # ESC ( J
    `);
    const result = ec!(buf, 'PN');
    assert.equal(result, 'ﾔﾏﾀﾞ^ﾀﾛｳ=山田^太郎=やまだ^たろう');
  });

  // Failing
  test.skip('I: Korean', async function() {
    const ec = await createEncConverter('\\ISO 2022 IR 149');
    const buf = encodeToBuffer(`
      04/08 06/15 06/14 06/07                    # Hong
      05/14                                      # ^
      04/07 06/09 06/12 06/04 06/15 06/14 06/07  # Gildong
      03/13                                      # =
      01/11 02/04 02/09 04/03                    # ESC $ ) C
      15/11 15/03                                # 洪
      05/14                                      # ^
      01/11 02/04 02/09 04/03                    # ESC $ ) C
      13/01 12/14 13/04 13/07                    # 吉洞
      03/13                                      # =
      01/11 02/04 02/09 04/03                    # ESC $ ) C
      12/08 10/11                                # 홍
      05/14                                      # ^
      01/11 02/04 02/09 04/03                    # ESC $ ) C
      11/01 14/06 11/05 11/15                    # 길동
    `);
    const result = ec!(buf, 'PN');
    assert.equal(result, 'Hong^Gildong=洪^吉洞=홍^길동');
  });

  test('J: Chinese with UTF8', async function() {
    const ec = await createEncConverter('ISO_IR 192');
    const buf = encodeToBuffer(`
      0x57 0x61 0x6e 0x67                      # Wang
      0x5e                                     # ^
      0x58 0x69 0x61 0x6f 0x44 0x6f 0x6e 0x67  # XiaoDong
      0x3d                                     # =
      0xe7 0x8e 0x8b                           # 王
      0x5e                                     # ^
      0xe5 0xb0 0x8f 0xe6 0x9d 0xb1            # 小東
      0x3d                                     # =
    `);
    const result = ec!(buf, 'PN');
    assert.equal(result, 'Wang^XiaoDong=王^小東=');
  });

  test('J: Chinese with GB18030', async function() {
    const ec = await createEncConverter('GB18030');
    const buf = encodeToBuffer(`
      0x57 0x61 0x6e 0x67                      # Wang
      0x5e                                     # ^
      0x58 0x69 0x61 0x6f 0x44 0x6f 0x6e 0x67  # XiaoDong
      0x3d                                     # =
      0xcd 0xf5                                # 王
      0x5e                                     # ^
      0xd0 0xa1 0xb6 0xab                      # 小东
      0x3d                                     # =
    `);
    const result = ec!(buf, 'PN');
    assert.equal(result, 'Wang^XiaoDong=王^小东=');
  });
});
