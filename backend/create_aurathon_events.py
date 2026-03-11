"""
创建Aurathon官方活动脚本
使用管理员账号创建多个示例活动
"""
import requests
from datetime import datetime, timedelta
import json

# API配置
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@aura.com"
ADMIN_PASSWORD = "admin123"

# 活动数据
AURATHON_EVENTS = [
    {
        "title": "Aurathon 2026 春季创新黑客松",
        "subtitle": "48小时极限编程挑战",
        "description": """Aurathon官方举办的春季创新黑客松，邀请全球开发者共同参与48小时极限编程挑战。

主题：AI for Good - 用人工智能解决社会问题

这是一个展示你技术实力和创新思维的绝佳机会！我们将提供：
- 强大的云计算资源支持
- 专业的导师指导
- 丰富的奖金池
- 与行业大咖面对面交流的机会

无论你是前端高手、后端大神还是AI专家，都能在这里找到志同道合的伙伴！""",
        "theme_tags": "AI,人工智能,社会创新,公益",
        "professionalism_tags": "高级,专业级",
        "format": "online",
        "location": "线上",
        "organizer_name": "Aurathon官方",
        "contact_info": json.dumps({"email": "events@aurathon.com", "wechat": "AurathonOfficial"}),
        "max_participants": 500,
        "awards_detail": json.dumps({
            "一等奖": "¥50,000 + 云资源券¥20,000",
            "二等奖": "¥30,000 + 云资源券¥10,000",
            "三等奖": "¥10,000 + 云资源券¥5,000",
            "最佳创意奖": "¥5,000",
            "最佳技术实现奖": "¥5,000"
        }),
        "rules_detail": """1. 团队规模：2-5人
2. 作品必须是活动期间原创
3. 可以使用开源库和API
4. 最终提交包括：代码、演示视频、PPT
5. 评委将根据创新性、技术难度、完成度、演示效果评分""",
        "requirements": "具备基本的编程能力，对AI技术有浓厚兴趣",
        "resource_detail": json.dumps({
            "计算资源": "GPU服务器免费使用",
            "API额度": "OpenAI API $100额度",
            "云服务": "阿里云/腾讯云代金券",
            "开发工具": "JetBrains全家桶授权"
        }),
        "scoring_dimensions": json.dumps([
            {"name": "创新性", "weight": 30, "description": "项目的创意和独特性"},
            {"name": "技术难度", "weight": 25, "description": "技术实现的复杂程度"},
            {"name": "完成度", "weight": 25, "description": "作品的完整性和可用性"},
            {"name": "演示效果", "weight": 20, "description": "路演展示的质量"}
        ]),
        "sponsors_detail": json.dumps([
            {"name": "阿里云", "level": "钻石赞助", "logo": "aliyun.png"},
            {"name": "腾讯云", "level": "金牌赞助", "logo": "tencent.png"},
            {"name": "OpenAI", "level": "技术赞助", "logo": "openai.png"}
        ]),
        "cover_image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
        "status": "published"
    },
    {
        "title": "Web3.0 去中心化应用挑战赛",
        "subtitle": "构建下一代互联网应用",
        "description": """探索区块链技术的无限可能，构建去中心化应用（DApp）。

赛道设置：
- DeFi 金融创新
- NFT 数字艺术
- DAO 去中心化自治
- GameFi 游戏金融

Aurathon官方联合多家知名Web3投资机构，为优秀项目提供：
- 种子轮融资机会
- 孵化器入驻资格
- 专业技术指导
- 全球推广资源

让我们一起构建Web3的未来！""",
        "theme_tags": "Web3,区块链,DeFi,NFT,DAO",
        "professionalism_tags": "中级,高级",
        "format": "online",
        "location": "线上",
        "organizer_name": "Aurathon官方 x Web3基金会",
        "contact_info": json.dumps({"email": "web3@aurathon.com", "telegram": "@AurathonWeb3"}),
        "max_participants": 300,
        "awards_detail": json.dumps({
            "总冠军": "¥100,000 + 投资机会",
            "赛道冠军": "¥30,000/赛道",
            "最佳技术奖": "¥10,000",
            "社区选择奖": "¥5,000"
        }),
        "rules_detail": """1. 必须使用区块链技术
2. 提交智能合约代码
3. 提供前端交互界面
4. 提交技术白皮书
5. 通过安全审计检查""",
        "requirements": "熟悉Solidity或其他智能合约语言，了解区块链基础",
        "resource_detail": json.dumps({
            "测试网": "ETH/Sepolia测试网代币",
            "节点服务": "Infura/Alchemy API",
            "安全审计": "CertiK快速审计",
            "存储": "IPFS免费存储空间"
        }),
        "scoring_dimensions": json.dumps([
            {"name": "技术创新", "weight": 35, "description": "区块链技术的创新应用"},
            {"name": "商业价值", "weight": 25, "description": "项目的商业可行性"},
            {"name": "用户体验", "weight": 20, "description": "产品的易用性"},
            {"name": "安全合规", "weight": 20, "description": "代码安全和合规性"}
        ]),
        "sponsors_detail": json.dumps([
            {"name": "以太坊基金会", "level": "主办", "logo": "eth.png"},
            {"name": "A16z", "level": "投资赞助", "logo": "a16z.png"},
            {"name": "Consensys", "level": "技术赞助", "logo": "consensys.png"}
        ]),
        "cover_image": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
        "status": "published"
    },
    {
        "title": "绿色科技环保创新赛",
        "subtitle": "用科技守护地球",
        "description": """响应联合国可持续发展目标，用技术创新解决环境问题。

关注领域：
- 碳中和与碳追踪
- 可再生能源管理
- 智能垃圾分类
- 水资源保护
- 生物多样性监测

Aurathon官方与联合国环境署合作，寻找能够真正改变世界的绿色科技项目。

特别福利：
- 优秀项目将获得联合国认证
- 有机会参加COP29气候大会展示
- 对接绿色投资基金""",
        "theme_tags": "环保,碳中和,可持续发展,绿色科技",
        "professionalism_tags": "初级,中级",
        "format": "online",
        "location": "线上",
        "organizer_name": "Aurathon官方 x 联合国环境署",
        "contact_info": json.dumps({"email": "green@aurathon.com"}),
        "max_participants": 400,
        "awards_detail": json.dumps({
            "最佳环保项目": "¥40,000 + 联合国认证",
            "碳中和创新奖": "¥20,000",
            "青年环保先锋": "¥10,000",
            "入围奖": "环保科技礼包"
        }),
        "rules_detail": """1. 项目必须与环境主题相关
2. 需要有可量化的环保指标
3. 提交环境影响评估报告
4. 代码开源优先
5. 鼓励跨学科团队合作""",
        "requirements": "对环保事业有热情，具备相关技术能力",
        "resource_detail": json.dumps({
            "数据集": "全球环境数据集",
            "IoT设备": "传感器借用计划",
            "云计算": "绿色数据中心资源",
            "专家指导": "环保领域专家1对1"
        }),
        "scoring_dimensions": json.dumps([
            {"name": "环保影响力", "weight": 40, "description": "对环境的实际改善效果"},
            {"name": "技术创新", "weight": 25, "description": "技术的创新性"},
            {"name": "可行性", "weight": 20, "description": "项目的落地可行性"},
            {"name": "可持续性", "weight": 15, "description": "长期运营的可持续性"}
        ]),
        "sponsors_detail": json.dumps([
            {"name": "联合国环境署", "level": "主办", "logo": "unep.png"},
            {"name": "特斯拉", "level": "钻石赞助", "logo": "tesla.png"},
            {"name": "WWF", "level": "公益伙伴", "logo": "wwf.png"}
        ]),
        "cover_image": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
        "status": "published"
    },
    {
        "title": "教育科技创新大赛",
        "subtitle": "重新定义未来教育",
        "description": """用科技改变教育，让每个人都能享受优质学习资源。

创新方向：
- AI个性化学习
- 虚拟现实教育
- 游戏化学习平台
- 在线教育工具
- 特殊教育辅助

Aurathon官方联合教育部、知名教育科技公司，寻找能够：
- 降低教育成本
- 提高学习效率
- 促进教育公平
- 激发学习兴趣

的创新项目！""",
        "theme_tags": "教育科技,EdTech,AI教育,在线教育",
        "professionalism_tags": "初级,中级,高级",
        "format": "online",
        "location": "线上",
        "organizer_name": "Aurathon官方 x 教育部",
        "contact_info": json.dumps({"email": "edu@aurathon.com"}),
        "max_participants": 600,
        "awards_detail": json.dumps({
            "最佳教育创新": "¥30,000 + 试点机会",
            "AI教育奖": "¥15,000",
            "普惠教育奖": "¥15,000",
            "优秀教师工具": "¥10,000",
            "学生选择奖": "¥5,000"
        }),
        "rules_detail": """1. 项目需有教育价值
2. 考虑不同年龄段用户需求
3. 提交教育效果评估方案
4. 鼓励与真实学校合作
5. 保护学生隐私数据""",
        "requirements": "对教育有热情，了解学习者需求",
        "resource_detail": json.dumps({
            "试点学校": "100+合作学校",
            "教育数据": "匿名化学习数据",
            "专家资源": "教育学专家指导",
            "推广渠道": "教育行业媒体"
        }),
        "scoring_dimensions": json.dumps([
            {"name": "教育价值", "weight": 35, "description": "对学习的实际帮助"},
            {"name": "用户体验", "weight": 25, "description": "产品的易用性"},
            {"name": "技术创新", "weight": 20, "description": "技术应用的创新性"},
            {"name": "普惠性", "weight": 20, "description": "覆盖人群的广泛性"}
        ]),
        "sponsors_detail": json.dumps([
            {"name": "教育部", "level": "指导单位", "logo": "moe.png"},
            {"name": "新东方", "level": "钻石赞助", "logo": "xdf.png"},
            {"name": "好未来", "level": "金牌赞助", "logo": "tal.png"}
        ]),
        "cover_image": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "status": "published"
    },
    {
        "title": "医疗健康科技创新赛",
        "subtitle": "科技让健康触手可及",
        "description": """用技术解决医疗健康领域的实际问题，改善人类生活质量。

关注方向：
- 远程医疗平台
- 健康监测设备
- 医疗数据分析
- 药物研发AI
- 心理健康应用

Aurathon官方联合顶级医疗机构和药企，为优秀项目提供：
- 临床试验机会
- 医疗专家指导
- 监管合规支持
- 产业对接资源

让我们一起用科技守护健康！""",
        "theme_tags": "医疗科技,HealthTech,AI医疗,数字健康",
        "professionalism_tags": "高级,专业级",
        "format": "online",
        "location": "线上",
        "organizer_name": "Aurathon官方 x 卫健委",
        "contact_info": json.dumps({"email": "health@aurathon.com"}),
        "max_participants": 250,
        "awards_detail": json.dumps({
            "最佳医疗创新": "¥60,000 + 临床合作",
            "AI医疗突破": "¥30,000",
            "患者关怀奖": "¥20,000",
            "技术卓越奖": "¥10,000"
        }),
        "rules_detail": """1. 符合医疗行业规范
2. 保护患者隐私
3. 通过伦理审查
4. 有医学专家参与
5. 提供安全性评估""",
        "requirements": "了解医疗行业，具备相关技术背景",
        "resource_detail": json.dumps({
            "医疗数据": "脱敏医疗数据集",
            "合规支持": "医疗器械注册指导",
            "专家网络": "三甲医院医生顾问",
            "临床试验": "合作医院试点机会"
        }),
        "scoring_dimensions": json.dumps([
            {"name": "医疗价值", "weight": 35, "description": "对医疗的实际改善"},
            {"name": "安全性", "weight": 30, "description": "产品的安全可靠性"},
            {"name": "技术创新", "weight": 20, "description": "技术的先进性"},
            {"name": "商业前景", "weight": 15, "description": "市场化潜力"}
        ]),
        "sponsors_detail": json.dumps([
            {"name": "卫健委", "level": "指导单位", "logo": "nhc.png"},
            {"name": "协和医院", "level": "医疗支持", "logo": "pumch.png"},
            {"name": "辉瑞", "level": "钻石赞助", "logo": "pfizer.png"}
        ]),
        "cover_image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
        "status": "published"
    },
    {
        "title": "金融科技黑客松",
        "subtitle": "重塑未来金融",
        "description": """探索金融科技的前沿应用，构建下一代金融服务。

创新领域：
- 智能投顾
- 风险管理
- 支付创新
- 保险科技
- 监管科技

Aurathon官方联合顶级金融机构，寻找能够：
- 提升金融效率
- 降低金融成本
- 增强风控能力
- 改善用户体验

的创新解决方案！

特别奖励：优秀项目有机会获得金融机构POC试点机会！""",
        "theme_tags": "金融科技,FinTech,区块链,支付,保险科技",
        "professionalism_tags": "中级,高级",
        "format": "online",
        "location": "线上",
        "organizer_name": "Aurathon官方 x 证监会",
        "contact_info": json.dumps({"email": "fintech@aurathon.com"}),
        "max_participants": 350,
        "awards_detail": json.dumps({
            "最佳金融科技创新": "¥50,000 + POC机会",
            "支付创新奖": "¥20,000",
            "风控卓越奖": "¥20,000",
            "用户体验奖": "¥10,000"
        }),
        "rules_detail": """1. 符合金融监管要求
2. 保障数据安全
3. 通过安全测试
4. 有金融业务逻辑
5. 考虑合规性""",
        "requirements": "了解金融行业，具备安全开发能力",
        "resource_detail": json.dumps({
            "金融数据": "模拟金融数据集",
            "API接口": "银行/支付API",
            "安全测试": "渗透测试服务",
            "合规咨询": "金融监管专家"
        }),
        "scoring_dimensions": json.dumps([
            {"name": "金融价值", "weight": 30, "description": "对金融业务的改善"},
            {"name": "安全性", "weight": 30, "description": "系统的安全可靠性"},
            {"name": "创新性", "weight": 25, "description": "方案的创新程度"},
            {"name": "可行性", "weight": 15, "description": "落地的可行性"}
        ]),
        "sponsors_detail": json.dumps([
            {"name": "证监会", "level": "指导单位", "logo": "csrc.png"},
            {"name": "蚂蚁集团", "level": "钻石赞助", "logo": "ant.png"},
            {"name": "招商银行", "level": "金牌赞助", "logo": "cmb.png"}
        ]),
        "cover_image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
        "status": "published"
    }
]


def get_admin_token():
    """获取管理员token"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/login/access-token",
            data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"登录失败: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"登录出错: {e}")
        return None


def create_hackathon(token, event_data, start_offset_days=7):
    """创建活动"""
    # 设置时间
    now = datetime.now()
    start_date = now + timedelta(days=start_offset_days)
    end_date = start_date + timedelta(days=2)
    
    # 构建请求数据
    payload = {
        **event_data,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "registration_start_date": now.isoformat(),
        "registration_end_date": (start_date - timedelta(days=1)).isoformat(),
        "submission_start_date": start_date.isoformat(),
        "submission_end_date": end_date.isoformat(),
        "judging_start_date": end_date.isoformat(),
        "judging_end_date": (end_date + timedelta(days=3)).isoformat(),
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/hackathons",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 成功创建活动: {event_data['title']} (ID: {data['id']})")
            return data
        else:
            print(f"❌ 创建失败: {event_data['title']} - {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ 创建出错: {event_data['title']} - {e}")
        return None


def main():
    print("=" * 60)
    print("Aurathon官方活动创建脚本")
    print("=" * 60)
    
    # 获取管理员token
    print("\n🔑 正在登录管理员账号...")
    token = get_admin_token()
    if not token:
        print("登录失败，退出")
        return
    print("✅ 登录成功！\n")
    
    # 创建活动
    print(f"📋 准备创建 {len(AURATHON_EVENTS)} 个活动...\n")
    created_count = 0
    
    for i, event in enumerate(AURATHON_EVENTS, 1):
        print(f"[{i}/{len(AURATHON_EVENTS)}] 创建: {event['title']}")
        result = create_hackathon(token, event, start_offset_days=7+i*7)
        if result:
            created_count += 1
        print()
    
    print("=" * 60)
    print(f"✅ 完成！成功创建 {created_count}/{len(AURATHON_EVENTS)} 个活动")
    print("=" * 60)


if __name__ == "__main__":
    main()
