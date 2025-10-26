## comandos git
cd ~/easysmart-platform
git add .
git commit -m "New /realtime and 6 new components"
git push origin main


## start frontend
cd ~/easysmart-platform/frontend
npm run dev

## start backend
cd ~/easysmart-platform/backend
npm run dev

## raiz do servidor e do projeto
cd ~/
cd ~/easysmart-platform/

## criar arquivo via cat EOF
cd ~/easysmart-platform/frontend

# 1. CollapsibleDeviceCard
cat > src/components/CollapsibleDeviceCard.tsx << 'EOF'
//Cole o conteúdo aqui
EOF