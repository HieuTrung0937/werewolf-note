let players = JSON.parse(localStorage.getItem("ws-players")) || [];
let isLocked = false;

const board = document.getElementById("board");
const inputElement = document.getElementById("player-name");

// --- HÀM LƯU & HIỂN THỊ ---
function save() {
  localStorage.setItem("ws-players", JSON.stringify(players));
}
// Thêm biến quản lý kích thước
let cardScale = parseFloat(localStorage.getItem("ws-scale")) || 1;

// --- CHỨC NĂNG PHÓNG TO / THU NHỎ ---
const zoomSlider = document.getElementById("zoom-slider");
zoomSlider.value = cardScale;
document.documentElement.style.setProperty("--card-scale", cardScale);

zoomSlider.addEventListener("input", (e) => {
  cardScale = e.target.value;
  document.documentElement.style.setProperty("--card-scale", cardScale);
  localStorage.setItem("ws-scale", cardScale);
});

// --- CHỐNG RELOAD 2 LỚP ---

// Lớp 1: Chặn sự kiện thoát trang mặc định của trình duyệt
window.addEventListener("beforeunload", (e) => {
  if (players.length > 0) {
    e.preventDefault();
    e.returnValue = "Dữ liệu ván game sẽ bị mất nếu bạn thoát!";
  }
});

// Lớp 2: Kiểm tra hành vi "Double Check" khi thực hiện các lệnh xóa/reset
function clearAll() {
  // Hỏi lần 1
  const firstCheck = confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA HẾT KHÔNG?");
  if (firstCheck) {
    // Hỏi lần 2 sau một khoảng trễ nhỏ để tránh bấm nhầm liên tục
    setTimeout(() => {
      const secondCheck = confirm(
        "XÁC NHẬN LẦN CUỐI: Hành động này sẽ xóa sạch mọi thiết lập và người chơi!",
      );
      if (secondCheck) {
        players = [];
        render();
        save();
        alert("Đã làm mới bàn chơi.");
      }
    }, 300);
  }
}

// Cập nhật hàm render để thẻ không bị tràn khi zoom
function render() {
  board.innerHTML = "";
  players.forEach((p) => {
    const card = document.createElement("div");
    card.className = `player-card bg-gray-800 p-3 rounded-xl border-l-4 shadow-2xl ${p.isAlive ? "border-green-500" : "border-red-600"} ${!p.isAlive ? "is-dead" : ""}`;

    card.style.left = p.x + "%";
    card.style.top = p.y + "%";

    // Nội dung thẻ giữ nguyên như bản trước...
    card.innerHTML = `
            <div class="text-center">
                <h3 class="font-bold text-[10px] mb-2 truncate px-1 uppercase">${p.name}</h3>
                <div class="flex flex-col gap-1">
                    <button onclick="event.stopPropagation(); toggleStatus(${p.id})" 
                        class="text-[8px] font-black py-1 rounded ${p.isAlive ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}">
                        ${p.isAlive ? "SỐNG" : "CHẾT"}
                    </button>
                    <input type="text" placeholder="Role..." value="${p.role || ""}" 
                        onchange="updateRole(${p.id}, this.value)"
                        class="bg-gray-900 text-[9px] p-1 rounded border-none text-center text-gray-300">
                    <textarea oninput="updateNote(${p.id}, this.value)"
                        class="bg-gray-900 text-[8px] p-1 rounded h-10 border-none text-gray-400" 
                        placeholder="Note...">${p.note || ""}</textarea>
                </div>
            </div>
        `;

    if (!isLocked) makeDraggable(card, p);
    board.appendChild(card);
  });
  updateStats();
}

// Các hàm makeDraggable, addPlayer... giữ nguyên từ bản trước
// --- LOGIC KÉO THẢ TỰ DO ---
function makeDraggable(elmnt, playerObj) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  elmnt.onmousedown = dragMouseDown;
  elmnt.ontouchstart = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    // Lấy tọa độ lúc bắt đầu (hỗ trợ cả chuột và cảm ứng)
    pos3 = e.clientX || e.touches[0].clientX;
    pos4 = e.clientY || e.touches[0].clientY;

    document.onmouseup = closeDragElement;
    document.ontouchend = closeDragElement;
    document.onmousemove = elementDrag;
    document.ontouchmove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    let clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    let clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

    pos1 = pos3 - clientX;
    pos2 = pos4 - clientY;
    pos3 = clientX;
    pos4 = clientY;

    // Tính toán vị trí mới
    let newTop = elmnt.offsetTop - pos2;
    let newLeft = elmnt.offsetLeft - pos1;

    // Cập nhật giao diện tức thì
    elmnt.style.top = newTop + "px";
    elmnt.style.left = newLeft + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;

    // Chuyển đổi px sang % để lưu trữ bền vững
    playerObj.x = (elmnt.offsetLeft / board.offsetWidth) * 100;
    playerObj.y = (elmnt.offsetTop / board.offsetHeight) * 100;
    save();
  }
}

// --- CÁC HÀM TIỆN ÍCH ---
function addPlayer() {
  const name = inputElement.value.trim();
  if (!name) return;
  players.push({
    id: Date.now(),
    name: name,
    x: 10,
    y: 10, // Vị trí mặc định khi mới thêm
    isAlive: true,
    role: "",
    note: "",
  });
  inputElement.value = "";
  render();
  save();
}

function toggleStatus(id) {
  const p = players.find((x) => x.id === id);
  p.isAlive = !p.isAlive;
  render();
  save();
}

function updateRole(id, val) {
  players.find((x) => x.id === id).role = val;
  save();
}
function updateNote(id, val) {
  players.find((x) => x.id === id).note = val;
  save();
}
function deletePlayer(id) {
  players = players.filter((x) => x.id !== id);
  render();
  save();
}
function toggleLock() {
  isLocked = !isLocked;
  document.getElementById("lock-btn").innerText = isLocked
    ? "🔓 MỞ KHÓA VỊ TRÍ"
    : "🔒 KHÓA VỊ TRÍ";
  render();
}

function updateStats() {
  document.getElementById("total-count").innerText = players.length;
  document.getElementById("alive-count").innerText = players.filter(
    (p) => p.isAlive,
  ).length;
  document.getElementById("dead-count").innerText = players.filter(
    (p) => !p.isAlive,
  ).length;
}

render();
