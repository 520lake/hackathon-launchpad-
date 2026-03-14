#!/usr/bin/env python3
"""
修复 HackathonDetailModal.tsx 中的 lang 属性
"""
import re

file_path = r'd:\ms_deploy_new\frontend\src\components\HackathonDetailModal.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 JudgingModal
content = content.replace(
    '''<JudgingModal
        isOpen={isJudgingOpen}
        onClose={() => setIsJudgingOpen(false)}
        hackathonId={hackathonId}
        hackathonTitle={hackathon?.title || ''}
      />''',
    '''<JudgingModal
        isOpen={isJudgingOpen}
        onClose={() => setIsJudgingOpen(false)}
        hackathonId={hackathonId}
        hackathonTitle={hackathon?.title || ''}
        lang={lang}
      />'''
)

# 修复 ResultPublishModal
content = content.replace(
    '''<ResultPublishModal
        isOpen={isResultPublishOpen}
        onClose={() => { setIsResultPublishOpen(false); fetchHackathon(); }}
        hackathonId={hackathonId}
      />''',
    '''<ResultPublishModal
        isOpen={isResultPublishOpen}
        onClose={() => { setIsResultPublishOpen(false); fetchHackathon(); }}
        hackathonId={hackathonId}
        lang={lang}
      />'''
)

# 修复 AIResumeModal
content = content.replace(
    '''<AIResumeModal
        isOpen={isAIResumeOpen}
        onClose={() => setIsAIResumeOpen(false)}
        onSave={handleSaveResume}
      />''',
    '''<AIResumeModal
        isOpen={isAIResumeOpen}
        onClose={() => setIsAIResumeOpen(false)}
        onSave={handleSaveResume}
        lang={lang}
      />'''
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed HackathonDetailModal.tsx")
