#!/bin/bash

# 确保持久化目录存在
mkdir -p /mnt/workspace

# 设置默认数据库路径（如果未设置）
if [ -z "$DATABASE_URL" ]; then
    # 检查是否有持久化挂载目录
    if [ -d "/mnt/workspace" ]; then
        echo "Found /mnt/workspace, using it for database persistence..."
        export DATABASE_URL="sqlite:////mnt/workspace/vibebuild.db"
    else
        echo "No persistent volume found, using default local sqlite..."
        export DATABASE_URL="sqlite:///./vibebuild.db"
    fi
fi

echo "Using database: $DATABASE_URL"

# 检查DB文件状态
DB_FILE=$(echo $DATABASE_URL | sed 's/sqlite:\/\/\///')
echo "Checking DB file: $DB_FILE"
ls -l $DB_FILE || echo "File not found (yet)"

# 运行数据库迁移 (允许失败，后续脚本会强制修复)
echo "Running migrations..."
alembic upgrade head || echo "WARNING: Alembic upgrade failed. Proceeding to manual fix..."

# 强制修复数据库Schema (防止Alembic失效)
echo "Force fixing DB schema..."
python ../scripts/fix_db_schema.py

# 再次检查DB文件状态
echo "DB file status after fix:"
ls -l $DB_FILE || echo "File not found"

# 创建初始数据（管理员账号）
echo "Creating initial data..."
python -m app.initial_data

# 创建Mock Hackathons (如果不存在)
echo "Seeding Hackathons..."
python ../scripts/seed_hackathons.py

# 创建Mock Teams/Projects (如果不存在)
echo "Populating Mock Data..."
python ../scripts/populate_mock_data.py

# 再次运行修复脚本，防止seed脚本引入旧schema问题（不太可能，但保险起见）
echo "Running schema fix one last time..."
python ../scripts/fix_db_schema.py

# 启动应用
echo "Starting application on port 7860..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 7860
