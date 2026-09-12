/* =====================================================
   Supabase 설정
===================================================== */

const SUPABASE_URL =
    "https://wctknuijnyxbzpdplgrz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_QjOYrVQHQuqpF8n8hsk_3Q__QEbvwhI";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   전역 변수
===================================================== */

let currentUser = null;
let records = [];

let authMode = "login";

let calendarDate = new Date();

let selectedDate = new Date();


/* =====================================================
   DOM
===================================================== */

const authPage =
    document.getElementById("authPage");

const appPage =
    document.getElementById("appPage");

const authName =
    document.getElementById("authName");

const authPassword =
    document.getElementById("authPassword");

const authButton =
    document.getElementById("authButton");

const authMessage =
    document.getElementById("authMessage");

const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");

const authTitle =
    document.getElementById("authTitle");

const authDescription =
    document.getElementById("authDescription");

const passwordHelp =
    document.getElementById("passwordHelp");


/* =====================================================
   로그인 저장
===================================================== */

function saveLogin(user) {

    localStorage.setItem(
        "workoutUser",
        JSON.stringify(user)
    );
}


function loadLogin() {

    const saved =
        localStorage.getItem("workoutUser");

    if (!saved) {
        return null;
    }

    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}


function removeLogin() {

    localStorage.removeItem(
        "workoutUser"
    );
}


/* =====================================================
   비밀번호 검사
===================================================== */

function checkPassword(password) {

    if (password.length < 6) {
        return false;
    }

    if (/\s/.test(password)) {
        return false;
    }

    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/.test(password)) {
        return false;
    }

    if (!/[A-Za-z]/.test(password)) {
        return false;
    }

    if (!/[0-9]/.test(password)) {
        return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
        return false;
    }

    return true;
}


/* =====================================================
   인증 메시지
===================================================== */

function showAuthMessage(message) {

    authMessage.textContent = message;
}


/* =====================================================
   로그인 / 회원가입 탭
===================================================== */

loginTab.addEventListener("click", () => {

    authMode = "login";

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    authTitle.textContent =
        "다시 만나서 반가워요";

    authDescription.textContent =
        "운동 기록을 확인하려면 로그인하세요.";

    authButton.textContent =
        "로그인";

    passwordHelp.classList.add("hidden");

    showAuthMessage("");
});


signupTab.addEventListener("click", () => {

    authMode = "signup";

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    authTitle.textContent =
        "새 계정을 만들어보세요";

    authDescription.textContent =
        "이름과 비밀번호만으로 시작할 수 있습니다.";

    authButton.textContent =
        "회원가입";

    passwordHelp.classList.remove("hidden");

    showAuthMessage("");
});


/* =====================================================
   로그인 / 회원가입
===================================================== */

authButton.addEventListener("click", async () => {

    const name =
        authName.value.trim();

    const password =
        authPassword.value;

    if (!name) {

        showAuthMessage(
            "이름을 입력해주세요."
        );

        return;
    }

    if (!password) {

        showAuthMessage(
            "비밀번호를 입력해주세요."
        );

        return;
    }


    if (
        authMode === "signup" &&
        !checkPassword(password)
    ) {

        showAuthMessage(
            "비밀번호 조건을 확인해주세요."
        );

        return;
    }


    const originalText =
        authMode === "login"
            ? "로그인"
            : "회원가입";

    authButton.textContent =
        authMode === "login"
            ? "로그인 중..."
            : "회원가입 중...";

    authButton.disabled = true;


    try {

        let result;


        /* 회원가입 */

        if (authMode === "signup") {

            result =
                await supabaseClient.rpc(
                    "register_user",
                    {
                        p_name: name,
                        p_password: password
                    }
                );

        }


        /* 로그인 */

        else {

            result =
                await supabaseClient.rpc(
                    "login_user",
                    {
                        p_name: name,
                        p_password: password
                    }
                );
        }


        if (result.error) {
            throw result.error;
        }


        if (!result.data) {

            throw new Error(
                "사용자 정보를 받아오지 못했습니다."
            );
        }


        let user =
            Array.isArray(result.data)
                ? result.data[0]
                : result.data;


        if (!user || !user.id) {

            throw new Error(
                authMode === "login"
                    ? "이름 또는 비밀번호가 올바르지 않습니다."
                    : "회원가입에 실패했습니다."
            );
        }


        currentUser = user;

        saveLogin(user);

        await openApp();

    } catch (error) {

        console.error(error);

        showAuthMessage(
            error.message ||
            "오류가 발생했습니다."
        );

    } finally {

        authButton.disabled = false;

        authButton.textContent =
            originalText;
    }

});


/* =====================================================
   앱 열기
===================================================== */

async function openApp() {

    authPage.classList.add("hidden");
    appPage.classList.remove("hidden");

    window.scrollTo(0, 0);

    document.getElementById(
        "userNameDisplay"
    ).textContent =
        currentUser.name || "사용자";

    await loadRecords();

    renderAll();

    renderCalendar();
}


/* =====================================================
   기록 불러오기
===================================================== */

async function loadRecords() {

    if (!currentUser) {
        records = [];
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("exercise_records")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "date",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        alert(
            "운동 기록을 불러오지 못했습니다."
        );

        records = [];

        return;
    }


    records = data || [];
}


/* =====================================================
   재귀 함수
   전체 운동 시간 계산
===================================================== */

function sum(n) {

    if (n === 0) {
        return 0;
    }

    return (
        Number(records[n - 1].time) +
        sum(n - 1)
    );
}


/* =====================================================
   가장 오래 운동한 기록
===================================================== */

function getBest() {

    if (records.length === 0) {
        return null;
    }


    let best =
        records[0];


    for (let i = 1; i < records.length; i++) {

        if (
            Number(records[i].time) >
            Number(best.time)
        ) {

            best =
                records[i];
        }
    }


    return best;
}


/* =====================================================
   날짜 키
   YYYY-MM-DD
===================================================== */

function getDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =====================================================
   기록의 날짜 키
===================================================== */

function getRecordDateKey(record) {

    const date =
        new Date(record.date);

    return getDateKey(date);
}


/* =====================================================
   오늘 통계
===================================================== */

function getTodayStats() {

    const today =
        getDateKey(new Date());

    let total = 0;
    let count = 0;


    for (const record of records) {

        if (
            getRecordDateKey(record) ===
            today
        ) {

            total +=
                Number(record.time);

            count++;
        }
    }


    return {
        total,
        count
    };
}


/* =====================================================
   이번 주 통계
   월요일 ~ 오늘
===================================================== */

function getWeekStats() {

    const today =
        new Date();

    const day =
        today.getDay();

    const diff =
        day === 0
            ? 6
            : day - 1;


    const startOfWeek =
        new Date(today);

    startOfWeek.setDate(
        today.getDate() - diff
    );

    startOfWeek.setHours(
        0,
        0,
        0,
        0
    );


    const endOfWeek =
        new Date(today);

    endOfWeek.setHours(
        23,
        59,
        59,
        999
    );


    let total = 0;
    let count = 0;


    for (const record of records) {

        const date =
            new Date(record.date);

        if (
            date >= startOfWeek &&
            date <= endOfWeek
        ) {

            total +=
                Number(record.time);

            count++;
        }
    }


    return {
        total,
        count
    };
}


/* =====================================================
   이번 달 통계
===================================================== */

function getMonthStats() {

    const today =
        new Date();


    const startOfMonth =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
            0,
            0,
            0,
            0
        );


    const endOfMonth =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );


    let total = 0;
    let count = 0;


    for (const record of records) {

        const date =
            new Date(record.date);

        if (
            date >= startOfMonth &&
            date <= endOfMonth
        ) {

            total +=
                Number(record.time);

            count++;
        }
    }


    return {
        total,
        count
    };
}


/* =====================================================
   날짜 표시
===================================================== */

function formatDate(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        "ko-KR",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


/* =====================================================
   기록 아이콘
===================================================== */

function getIcon(name) {

    if (!name) {
        return "W";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}


/* =====================================================
   전체 렌더링
===================================================== */

function renderAll() {

    renderRecordPage();

    renderStatsPage();

    renderCalendar();
}


/* =====================================================
   기록 페이지
===================================================== */

function renderRecordPage() {

    const total =
        records.length > 0
            ? sum(records.length)
            : 0;


    const count =
        records.length;


    const average =
        count > 0
            ? Math.round(total / count)
            : 0;


    const best =
        getBest();


    const today =
        getTodayStats();


    const week =
        getWeekStats();


    const month =
        getMonthStats();


    document.getElementById(
        "totalTime"
    ).textContent =
        total + "분";


    document.getElementById(
        "recordCount"
    ).textContent =
        count + "회";


    document.getElementById(
        "averageTime"
    ).textContent =
        average + "분";


    document.getElementById(
        "bestTime"
    ).textContent =
        best
            ? Number(best.time) + "분"
            : "0분";


    document.getElementById(
        "todayTime"
    ).textContent =
        today.total + "분";


    document.getElementById(
        "todayCount"
    ).textContent =
        today.count + "회 기록";


    document.getElementById(
        "weekTime"
    ).textContent =
        week.total + "분";


    document.getElementById(
        "weekCount"
    ).textContent =
        week.count + "회 기록";


    document.getElementById(
        "monthTime"
    ).textContent =
        month.total + "분";


    document.getElementById(
        "monthCount"
    ).textContent =
        month.count + "회 기록";


    document.getElementById(
        "recordTotalLabel"
    ).textContent =
        count + "개";


    const list =
        document.getElementById(
            "recordList"
        );


    list.innerHTML = "";


    if (records.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <strong>아직 운동 기록이 없습니다.</strong>
                기록 추가 버튼을 눌러 첫 운동을 기록해보세요.
            </div>
        `;

        return;
    }


    for (const record of records) {

        const item =
            document.createElement("div");

        item.className =
            "record-item";


        item.innerHTML = `
            <div class="record-left">

                <div class="record-icon">
                    ${getIcon(record.name)}
                </div>

                <div>
                    <div class="record-name">
                        ${escapeHtml(record.name)}
                    </div>

                    <div class="record-date">
                        ${formatDate(record.date)}
                    </div>
                </div>

            </div>

            <div class="record-right">

                <strong class="record-time">
                    ${Number(record.time)}분
                </strong>

                <button
                    class="delete-record"
                    data-id="${record.id}"
                    title="삭제"
                >
                    ×
                </button>

            </div>
        `;


        list.appendChild(item);
    }


    document
        .querySelectorAll(".delete-record")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteRecord(
                        button.dataset.id
                    );
                }
            );
        });
}


/* =====================================================
   통계 페이지
===================================================== */

function renderStatsPage() {

    const total =
        records.length > 0
            ? sum(records.length)
            : 0;


    const count =
        records.length;


    const average =
        count > 0
            ? Math.round(total / count)
            : 0;


    const best =
        getBest();


    const today =
        getTodayStats();


    const week =
        getWeekStats();


    const month =
        getMonthStats();


    document.getElementById(
        "statsTotalTime"
    ).textContent =
        total + "분";


    document.getElementById(
        "statsRecordCount"
    ).textContent =
        count + "회";


    document.getElementById(
        "statsTodayTime"
    ).textContent =
        today.total + "분";


    document.getElementById(
        "statsTodayCount"
    ).textContent =
        today.count + "회";


    document.getElementById(
        "statsWeekTime"
    ).textContent =
        week.total + "분";


    document.getElementById(
        "statsWeekCount"
    ).textContent =
        week.count + "회";


    document.getElementById(
        "statsMonthTime"
    ).textContent =
        month.total + "분";


    document.getElementById(
        "statsMonthCount"
    ).textContent =
        month.count + "회";


    document.getElementById(
        "statsAverageTime"
    ).textContent =
        average + "분";


    document.getElementById(
        "statsBestTime"
    ).textContent =
        best
            ? Number(best.time) + "분"
            : "0분";


    document.getElementById(
        "statsBestName"
    ).textContent =
        best
            ? best.name
            : "-";


    const max =
        Math.max(
            today.count,
            week.count,
            month.count,
            1
        );


    document.getElementById(
        "todayBar"
    ).style.width =
        `${(today.count / max) * 100}%`;


    document.getElementById(
        "weekBar"
    ).style.width =
        `${(week.count / max) * 100}%`;


    document.getElementById(
        "monthBar"
    ).style.width =
        `${(month.count / max) * 100}%`;


    document.getElementById(
        "todayBarValue"
    ).textContent =
        today.count + "회";


    document.getElementById(
        "weekBarValue"
    ).textContent =
        week.count + "회";


    document.getElementById(
        "monthBarValue"
    ).textContent =
        month.count + "회";


    renderStatsRecent();
}


/* =====================================================
   통계 최근 기록
===================================================== */

function renderStatsRecent() {

    const container =
        document.getElementById(
            "statsRecentList"
        );


    container.innerHTML = "";


    const recent =
        records.slice(0, 7);


    if (recent.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                아직 기록이 없습니다.
            </div>
        `;

        return;
    }


    for (const record of recent) {

        const item =
            document.createElement("div");

        item.className =
            "stats-recent-item";


        item.innerHTML = `

            <div>

                <div class="stats-recent-name">
                    ${escapeHtml(record.name)}
                </div>

                <div class="stats-recent-date">
                    ${formatDate(record.date)}
                </div>

            </div>

            <strong class="stats-recent-time">
                ${Number(record.time)}분
            </strong>

        `;


        container.appendChild(item);
    }
}


/* =====================================================
   캘린더 렌더링
===================================================== */

function renderCalendar() {

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    document.getElementById(
        "calendarTitle"
    ).textContent =
        `${year}년 ${month + 1}월`;


    const grid =
        document.getElementById(
            "calendarGrid"
        );


    grid.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    const startWeekday =
        firstDay.getDay();


    const daysInMonth =
        lastDay.getDate();


    const previousLastDay =
        new Date(
            year,
            month,
            0
        ).getDate();


    const totalCells =
        Math.ceil(
            (
                startWeekday +
                daysInMonth
            ) / 7
        ) * 7;


    const todayKey =
        getDateKey(new Date());


    const selectedKey =
        getDateKey(selectedDate);


    for (
        let i = 0;
        i < totalCells;
        i++
    ) {

        let dayNumber;
        let cellDate;
        let otherMonth = false;


        if (i < startWeekday) {

            dayNumber =
                previousLastDay -
                startWeekday +
                i +
                1;


            cellDate =
                new Date(
                    year,
                    month - 1,
                    dayNumber
                );

            otherMonth = true;

        } else if (
            i >=
            startWeekday +
            daysInMonth
        ) {

            dayNumber =
                i -
                (
                    startWeekday +
                    daysInMonth
                ) +
                1;


            cellDate =
                new Date(
                    year,
                    month + 1,
                    dayNumber
                );

            otherMonth = true;

        } else {

            dayNumber =
                i -
                startWeekday +
                1;


            cellDate =
                new Date(
                    year,
                    month,
                    dayNumber
                );
        }


        const dateKey =
            getDateKey(cellDate);


        const dayRecords =
            records.filter(
                record =>
                    getRecordDateKey(record) ===
                    dateKey
            );


        const cell =
            document.createElement("button");


        cell.type = "button";

        cell.className =
            "calendar-day";


        if (otherMonth) {
            cell.classList.add(
                "other-month"
            );
        }


        if (dateKey === todayKey) {
            cell.classList.add(
                "today"
            );
        }


        if (dateKey === selectedKey) {
            cell.classList.add(
                "selected"
            );
        }


        cell.innerHTML = `

            <span class="day-number">
                ${dayNumber}
            </span>

            ${
                dayRecords.length > 0
                    ? `
                        <span class="workout-dot">
                            ${dayRecords.length}회
                        </span>
                    `
                    : ""
            }

        `;


        cell.addEventListener(
            "click",
            () => {

                selectedDate =
                    cellDate;


                calendarDate =
                    new Date(
                        cellDate.getFullYear(),
                        cellDate.getMonth(),
                        1
                    );


                renderCalendar();
            }
        );


        grid.appendChild(cell);
    }


    renderSelectedDay();
}


/* =====================================================
   선택한 날짜
===================================================== */

function renderSelectedDay() {

    const dateKey =
        getDateKey(selectedDate);


    const dayRecords =
        records.filter(
            record =>
                getRecordDateKey(record) ===
                dateKey
        );


    document.getElementById(
        "selectedDateTitle"
    ).textContent =
        selectedDate.toLocaleDateString(
            "ko-KR",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long"
            }
        );


    let total = 0;


    for (const record of dayRecords) {

        total +=
            Number(record.time);
    }


    const average =
        dayRecords.length > 0
            ? Math.round(
                total /
                dayRecords.length
            )
            : 0;


    document.getElementById(
        "selectedDayTotal"
    ).textContent =
        total + "분";


    document.getElementById(
        "selectedDayCount"
    ).textContent =
        dayRecords.length + "회";


    document.getElementById(
        "selectedDayAverage"
    ).textContent =
        average + "분";


    const list =
        document.getElementById(
            "selectedDayRecords"
        );


    list.innerHTML = "";


    if (dayRecords.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <strong>운동 기록이 없습니다.</strong>
                이 날짜에는 저장된 운동 기록이 없습니다.
            </div>
        `;

        return;
    }


    for (const record of dayRecords) {

        const item =
            document.createElement("div");

        item.className =
            "day-record";


        item.innerHTML = `

            <span class="day-record-name">
                ${escapeHtml(record.name)}
            </span>

            <strong class="day-record-time">
                ${Number(record.time)}분
            </strong>

        `;


        list.appendChild(item);
    }
}


/* =====================================================
   기록 추가
===================================================== */

document
    .getElementById("exerciseForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "로그인이 필요합니다."
                );

                return;
            }


            const name =
                document.getElementById(
                    "exerciseName"
                ).value.trim();


            const time =
                Number(
                    document.getElementById(
                        "exerciseTime"
                    ).value
                );


            if (!name) {

                alert(
                    "운동 이름을 입력해주세요."
                );

                return;
            }


            if (
                !Number.isFinite(time) ||
                time <= 0
            ) {

                alert(
                    "운동 시간을 올바르게 입력해주세요."
                );

                return;
            }


            const saveButton =
                document.getElementById(
                    "saveRecordButton"
                );


            saveButton.disabled =
                true;

            saveButton.textContent =
                "저장 중...";


            try {

                const { data, error } =
                    await supabaseClient
                        .from(
                            "exercise_records"
                        )
                        .insert([
                            {
                                user_id:
                                    currentUser.id,

                                name:
                                    name,

                                time:
                                    time,

                                date:
                                    new Date().toISOString()
                            }
                        ])
                        .select()
                        .single();


                if (error) {
                    throw error;
                }


                records.unshift(data);


                renderAll();


                closeModal();


                document
                    .getElementById(
                        "exerciseForm"
                    )
                    .reset();


                showToast(
                    "운동 기록이 저장되었습니다."
                );


            } catch (error) {

                console.error(error);

                alert(
                    "운동 기록 저장에 실패했습니다.\n" +
                    error.message
                );

            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "기록 저장";
            }
        }
    );


/* =====================================================
   기록 삭제
===================================================== */

async function deleteRecord(id) {

    if (
        !confirm(
            "이 운동 기록을 삭제할까요?"
        )
    ) {
        return;
    }


    try {

        const { error } =
            await supabaseClient
                .from(
                    "exercise_records"
                )
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        records =
            records.filter(
                record =>
                    String(record.id) !==
                    String(id)
            );


        renderAll();


        showToast(
            "기록이 삭제되었습니다."
        );


    } catch (error) {

        console.error(error);

        alert(
            "삭제에 실패했습니다.\n" +
            error.message
        );
    }
}


/* =====================================================
   전체 삭제
===================================================== */

async function clearAllRecords() {

    if (!currentUser) {
        return;
    }


    if (records.length === 0) {

        alert(
            "삭제할 기록이 없습니다."
        );

        return;
    }


    if (
        !confirm(
            "모든 운동 기록을 삭제할까요?"
        )
    ) {
        return;
    }


    try {

        const { error } =
            await supabaseClient
                .from(
                    "exercise_records"
                )
                .delete()
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {
            throw error;
        }


        records = [];


        renderAll();


        showToast(
            "모든 기록이 삭제되었습니다."
        );


    } catch (error) {

        console.error(error);

        alert(
            "전체 삭제에 실패했습니다.\n" +
            error.message
        );
    }
}


/* =====================================================
   모달
===================================================== */

const modal =
    document.getElementById(
        "modal"
    );


function openModal() {

    modal.classList.remove(
        "hidden"
    );

    document
        .getElementById(
            "exerciseName"
        )
        .focus();
}


function closeModal() {

    modal.classList.add(
        "hidden"
    );
}


document
    .getElementById(
        "addRecordButton"
    )
    .addEventListener(
        "click",
        openModal
    );


document
    .getElementById(
        "closeModalButton"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "modalBackdrop"
    )
    .addEventListener(
        "click",
        closeModal
    );


/* =====================================================
   네비게이션
===================================================== */

document
    .querySelectorAll(".nav-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const pageId =
                    button.dataset.page;


                document
                    .querySelectorAll(
                        ".nav-button"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });


                document
                    .querySelectorAll(
                        ".page"
                    )
                    .forEach(page => {

                        page.classList.remove(
                            "active-page"
                        );
                    });


                button.classList.add(
                    "active"
                );


                document
                    .getElementById(
                        pageId
                    )
                    .classList.add(
                        "active-page"
                    );


                window.scrollTo(
                    0,
                    0
                );


                if (
                    pageId ===
                    "calendarPage"
                ) {

                    renderCalendar();
                }


                if (
                    pageId ===
                    "statsPage"
                ) {

                    renderStatsPage();
                }
            }
        );
    });


/* =====================================================
   달력 이전 / 다음
===================================================== */

document
    .getElementById(
        "prevMonthButton"
    )
    .addEventListener(
        "click",
        () => {

            calendarDate =
                new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() - 1,
                    1
                );

            renderCalendar();
        }
    );


document
    .getElementById(
        "nextMonthButton"
    )
    .addEventListener(
        "click",
        () => {

            calendarDate =
                new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() + 1,
                    1
                );

            renderCalendar();
        }
    );


/* =====================================================
   오늘 버튼
===================================================== */

document
    .getElementById(
        "calendarTodayButton"
    )
    .addEventListener(
        "click",
        () => {

            const today =
                new Date();


            calendarDate =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );


            selectedDate =
                today;


            renderCalendar();
        }
    );


/* =====================================================
   로그아웃
===================================================== */

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "로그아웃할까요?"
                )
            ) {
                return;
            }


            removeLogin();

            currentUser =
                null;

            records = [];


            appPage.classList.add(
                "hidden"
            );

            authPage.classList.remove(
                "hidden"
            );


            authName.value = "";
            authPassword.value = "";

            showAuthMessage("");

            window.scrollTo(
                0,
                0
            );
        }
    );


/* =====================================================
   토스트
===================================================== */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =====================================================
   HTML 안전 처리
===================================================== */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   시작
===================================================== */

async function start() {

    const savedUser =
        loadLogin();


    if (savedUser) {

        currentUser =
            savedUser;

        await openApp();

    } else {

        authPage.classList.remove(
            "hidden"
        );

        appPage.classList.add(
            "hidden"
        );
    }
}


start();
