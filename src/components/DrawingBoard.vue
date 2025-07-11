<template>
  <div class="toolbar">
    <label>
      Color:
      <input type="color" v-model="current.color" />
    </label>
    <label>
      Size:
      <input v-model.number="current.size" class="toolbar__size_input"/>
      px
    </label>
    <button @click="() =>clearCanvas()">Clear</button>
  </div>
  <canvas ref="canvas" class="drawing_board"></canvas>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
interface DrawData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
  type?: string
}

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
const socket = new WebSocket('ws://localhost:8080');
let drawing = false;

const current = ref({
  color: '#000000',
  size: 2,
});


const getOffset = (e: MouseEvent) => {
  const rect = canvas.value!.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

const drawLine = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number,
  emit = true
): void => {
  if (!ctx) return;

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.closePath();

  if (emit) {
    const data: DrawData = { x0, y0, x1, y1, color, size };
    socket.send(JSON.stringify(data));
  }
};

const clearCanvas = (emit=true) => {
  if (ctx && canvas.value) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    if (emit){
        socket.send(JSON.stringify({ type: 'clear' }));
    }
  }
};

onMounted(() => {
  const c = canvas.value;
  if (!c) return;

  ctx = c.getContext('2d');
  if (!ctx) return;

  c.width = window.innerWidth - 50;
  c.height = window.innerHeight - 50;

  let prev = { x: 0, y: 0 };

  c.addEventListener('mousedown', (e: MouseEvent) => {
    drawing = true;
    const { x, y } = getOffset(e);
    prev.x = x;
    prev.y = y;
  });

  c.addEventListener('mousemove', (e: MouseEvent) => {
    if (!drawing) return;
    const { x, y } = getOffset(e);
    drawLine(prev.x, prev.y, x, y, current.value.color, current.value.size);
    prev.x = x;
    prev.y = y;
  });

  c.addEventListener('mouseup', () => (drawing = false));
  c.addEventListener('mouseleave', () => (drawing = false));

  socket.onmessage = async (message: MessageEvent<Blob | string>) => {
    const text = typeof message.data === 'string'
      ? message.data
      : await message.data.text();
    
    console.log('Received:', text);
    


    const data: DrawData = JSON.parse(text);
    if (data.type&&data.type === 'clear') {
      clearCanvas(false);
      return;
    }
    
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
  };
});
</script>

<style scoped>

.drawing_board {
  background-color: #fff;
  border: 3px solid #ccc;
  cursor: crosshair;
}

.toolbar {
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar__size_input {
  width: 50px;
}
</style>
