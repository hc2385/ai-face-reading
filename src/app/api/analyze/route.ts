import { NextRequest, NextResponse } from 'next/server';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || 'c91f32d0e744701d3f49f632ddb4e4c1.nPBmYXV2FwKpf8qr';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const FACE_READING_PROMPT = `你是一位精通中国传统面相学的大师，同时也精通现代心理学和命理学。请根据用户上传的面部照片进行详细的面相分析。

## 面相学知识背景

### 五官（五官为相学根基）
1. 耳（采听官）：关系长寿、智慧、少年运
2. 眉（保寿官）：关系健康、地位、兄弟缘
3. 眼（监察官）：关系意志力、心性、贵人运
4. 鼻（审辨官）：关系财富、健康、中年运
5. 口（出纳官）：关系幸福、食禄、晚年运

### 三停
1. 上停（发际至眉）：代表15-30岁运势，主智慧、祖业
2. 中停（眉至鼻准）：代表31-50岁运势，主事业、财富
3. 下停（鼻下至下巴）：代表51岁后运势，主福寿、子女

### 十二宫位
1. 命宫（印堂）：基本运势
2. 财帛宫（鼻头）：财富吉凶
3. 兄弟宫（眉毛）：兄弟关系
4. 夫妻宫（眼尾）：婚姻感情
5. 子女宫（下眼皮）：子嗣运
6. 疾厄宫（山根）：健康状况
7. 迁移宫（额角）：出行运
8. 奴仆宫（面颊下）：人际关系
9. 官禄宫（额中）：事业学业
10. 田宅宫（眼皮）：家运
11. 福德宫（眉上）：福气财运
12. 父母宫（额上左右）：父母缘

## 分析要求
请仔细观察照片中人物的面部特征，包括但不限于：
- 脸型轮廓、额头形状和饱满度
- 眉毛形状、浓淡、长短
- 眼睛大小、神采、眼距
- 鼻子高低、鼻翼
- 嘴唇厚薄、嘴角
- 下巴形状、颧骨高低
- 整体气色

请以专业、积极、有建设性的语气进行分析，给出正面引导。

## 输出格式
请严格按照以下JSON格式输出（确保是有效的JSON，不要包含任何其他内容）：

{
  "overview": "面相总体评价，200字左右的综合分析",
  "fiveOfficials": {
    "ear": "耳相分析，50-80字",
    "eyebrow": "眉相分析，50-80字",
    "eye": "眼相分析，50-80字",
    "nose": "鼻相分析，50-80字",
    "mouth": "口相分析，50-80字"
  },
  "threeZones": {
    "upper": "上停分析（少年运），60-100字",
    "middle": "中停分析（中年运），60-100字",
    "lower": "下停分析（晚年运），60-100字"
  },
  "twelvePalaces": {
    "life": "命宫分析",
    "wealth": "财帛宫分析",
    "siblings": "兄弟宫分析",
    "marriage": "夫妻宫分析",
    "children": "子女宫分析",
    "health": "疾厄宫分析",
    "travel": "迁移宫分析",
    "friends": "奴仆宫分析",
    "career": "官禄宫分析",
    "property": "田宅宫分析",
    "fortune": "福德宫分析",
    "parents": "父母宫分析"
  },
  "fortune": {
    "career": "事业运势预测，80-120字",
    "wealth": "财运预测，80-120字",
    "love": "感情运势预测，80-120字",
    "health": "健康运势预测，80-120字"
  },
  "advice": "综合建议和寄语，100-150字，积极正面",
  "luckyElements": {
    "color": "幸运颜色",
    "number": "幸运数字",
    "direction": "吉利方位"
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: '请上传图片' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    console.log('Image size:', buffer.length, 'bytes, type:', mimeType);

    // 使用智谱 glm-4v-flash 视觉模型（免费且支持图片）
    const requestBody = {
      model: 'glm-4v-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: FACE_READING_PROMPT,
            },
          ],
        },
      ],
      temperature: 0.7,
    };

    console.log('Calling Zhipu API with model: glm-4v-flash');
    
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Zhipu API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zhipu API error:', errorText);
      return NextResponse.json(
        { error: `AI分析服务暂时不可用，请稍后重试 (${response.status})` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('Got content length:', content?.length);

    if (!content) {
      return NextResponse.json(
        { error: '未能获取分析结果' },
        { status: 500 }
      );
    }

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content.substring(0, 500));
      
      // Return a fallback response based on content
      result = {
        overview: content.slice(0, 500) || '面相分析完成，您的面部特征显示出独特的个人魅力。',
        fiveOfficials: {
          ear: '耳型端正，代表智慧与福气，少年运势平顺。',
          eyebrow: '眉形秀丽，主贵人运佳，兄弟缘分深厚。',
          eye: '眼神明亮有神，心性善良，意志力坚定。',
          nose: '鼻相端正挺拔，财运稳健，中年运势上佳。',
          mouth: '口型周正，福禄双全，晚年生活安康。',
        },
        threeZones: {
          upper: '上停饱满开阔，代表少年时期运势平顺，智慧聪颖，学业顺利。',
          middle: '中停挺拔有力，预示中年事业有成，财运亨通，贵人相助。',
          lower: '下停圆润厚实，晚年福寿安康，子孙贤孝，家庭和美。',
        },
        twelvePalaces: {
          life: '命宫开阔明亮，基础运势良好',
          wealth: '财帛宫丰隆，财运亨通',
          siblings: '兄弟宫和睦，手足情深',
          marriage: '夫妻宫美满，姻缘和谐',
          children: '子女宫旺盛，子嗣运佳',
          health: '疾厄宫平稳，身体康健',
          travel: '迁移宫顺利，出行平安',
          friends: '奴仆宫充实，人缘极佳',
          career: '官禄宫高照，事业顺遂',
          property: '田宅宫安稳，家宅平安',
          fortune: '福德宫深厚，福气绑身',
          parents: '父母宫和顺，孝道双全',
        },
        fortune: {
          career: '事业运势良好，适合稳步发展，贵人相助，有望在专业领域取得突破。',
          wealth: '财运平稳向上，正财运佳，适合稳健理财，避免冒险投资。',
          love: '感情运势温和，单身者有望遇到良缘，已有伴者感情稳定。',
          health: '注意作息规律，保持心情愉悦，适当运动，身体自然康健。',
        },
        advice: '相由心生，保持积极乐观的心态是最好的开运方式。善待他人，广结善缘，福报自来。建议多行善事，保持谦逊，必能心想事成。',
        luckyElements: {
          color: '紫色、金色、蓝色',
          number: '3、6、8',
          direction: '东南方、正南方',
        },
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
