// ==========================================
// Supabase 설정
// ==========================================

const SUPABASE_URL =
    "https://wctknuijnyxbzpdplgrz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_QjOYrVQHQuqpF8n8hsk_3Q__QEbvwhI";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================
// 현재 로그인한 사용자
// ==========================================

let currentUser = null;
let records = [];


// ==========================================
// 로그인 정보 저장
// ==========================================

function saveLogin(user) {

    localStorage.setItem(
        "workoutUser",
        JSON.stringify(user)
    );

}


// ==========================================
// 로그인 정보 불러오기
// ==========================================

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


// ==========================================
// 로그아웃
// ==========================================

function removeLogin() {

    localStorage.removeItem(
        "workoutUser"
    );

}


// ==========================================
// 비밀번호 검사
// ==========================================

function checkPassword(password) {

    if (password.length < 6) {

        return "비밀번호는 6자 이상이어야 합니다.";

    }

    if (/\s/.test(password)) {

        return "비밀번호에는 공백을 사용할 수 없습니다.";

    }

    if (
        !/^[A-Za-z0-9!@#$%^&*()_+\-=\\[\]{};:,.<>?]+$/.test(password)
    ) {

        return "비밀번호는 영어, 숫자, 특수문자만 사용할 수 있습니다.";

    }

    if (!/[A-Za-z]/.test(password)) {

        return "비밀번호에 영어가 필요합니다.";

    }

    if (!/[0-9]/.test(password)) {

        return "비밀번호에 숫자가 필요합니다.";

    }

    if (!/[^A-Za-z0-9]/.test(password)) {

        return "비밀번호에 특수문자가 필요합니다.";

    }

    return null;

}


// ==========================================
// 로그인 메시지
// ==========================================

function showAuthMessage(message) {

    document.getElementById(
        "authMessage"
    ).textContent = message;

}


// ==========================================
// 로그인 / 회원가입 모드
// ==========================================

let authMode = "login";


// ==========================================
// 로그인 탭
// ==========================================

document
    .getElementById("loginTab")
    .addEventListener(
        "click",
        function () {

            authMode = "login";

            document
                .getElementById("loginTab")
                .classList.add("active");

            document
                .getElementById("signupTab")
                .classList.remove("active");

            document
                .getElementById("authButton")
                .textContent = "로그인";

            showAuthMessage("");

        }
    );


// ==========================================
// 회원가입 탭
// ==========================================

document
    .getElementById("signupTab")
    .addEventListener(
        "click",
        function () {

            authMode = "signup";

            document
                .getElementById("signupTab")
                .classList.add("active");

            document
                .getElementById("loginTab")
                .classList.remove("active");

            document
                .getElementById("authButton")
                .textContent = "회원가입";

            showAuthMessage("");

        }
    );


// ==========================================
// 로그인 / 회원가입
// 무한 로딩 방지 버전
// ==========================================

document
    .getElementById("authButton")
    .addEventListener(
        "click",
        async function () {

            const button =
                document.getElementById(
                    "authButton"
                );


            // 중복 클릭 방지

            if (button.disabled) {
                return;
            }


            const name =
                document
                    .getElementById("authName")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("authPassword")
                    .value;


            // ==================================
            // 이름 검사
            // ==================================

            if (name === "") {

                showAuthMessage(
                    "이름을 입력해주세요."
                );

                return;

            }


            if (name.length < 2) {

                showAuthMessage(
                    "이름은 2글자 이상 입력해주세요."
                );

                return;

            }


            // 버튼 잠금

            button.disabled = true;


            try {

                // ==================================
                // 회원가입
                // ==================================

                if (authMode === "signup") {

                    const passwordError =
                        checkPassword(password);


                    if (passwordError) {

                        showAuthMessage(
                            passwordError
                        );

                        return;

                    }


                    // 버튼 자체에 로딩 표시

                    button.textContent =
                        "회원가입 중...";


                    const result =
                        await Promise.race([

                            supabaseClient.rpc(
                                "register_user",
                                {
                                    p_name: name,
                                    p_password: password
                                }
                            ),

                            new Promise(
                                (_, reject) =>
                                    setTimeout(
                                        () =>
                                            reject(
                                                new Error(
                                                    "서버 응답 시간이 초과되었습니다."
                                                )
                                            ),
                                        10000
                                    )
                            )

                        ]);


                    if (result.error) {

                        console.error(
                            "회원가입 오류:",
                            result.error
                        );

                        showAuthMessage(
                            result.error.message
                        );

                        return;

                    }


                    if (!result.data) {

                        showAuthMessage(
                            "회원가입에 실패했습니다."
                        );

                        return;

                    }


                    currentUser =
                        result.data;


                    saveLogin(
                        currentUser
                    );


                    await openApp();

                    return;

                }


                // ==================================
                // 로그인
                // ==================================

                button.textContent =
                    "로그인 중...";


                const result =
                    await Promise.race([

                        supabaseClient.rpc(
                            "login_user",
                            {
                                p_name: name,
                                p_password: password
                            }
                        ),

                        new Promise(
                            (_, reject) =>
                                setTimeout(
                                    () =>
                                        reject(
                                            new Error(
                                                "서버 응답 시간이 초과되었습니다."
                                            )
                                        ),
                                    10000
                                )
                        )

                    ]);


                if (result.error) {

                    console.error(
                        "로그인 오류:",
                        result.error
                    );

                    showAuthMessage(
                        result.error.message
                    );

                    return;

                }


                if (!result.data) {

                    showAuthMessage(
                        "이름 또는 비밀번호가 틀렸습니다."
                    );

                    return;

                }


                currentUser =
                    result.data;


                saveLogin(
                    currentUser
                );


                await openApp();


            } catch (error) {

                console.error(
                    "로그인/회원가입 오류:",
                    error
                );


                if (
                    error &&
                    error.message
                ) {

                    showAuthMessage(
                        error.message
                    );

                } else {

                    showAuthMessage(
                        "로그인 중 오류가 발생했습니다."
                    );

                }


            } finally {

                // ==================================
                // 무조건 로딩 해제
                // ==================================

                button.disabled = false;


                // 버튼 글자 복구

                if (authMode === "login") {

                    button.textContent =
                        "로그인";

                } else {

                    button.textContent =
                        "회원가입";

                }

            }

        }
    );


// ==========================================
// 앱 열기
// ==========================================

async function openApp() {

    document
        .getElementById("authPage")
        .classList.add("hidden");


    document
        .getElementById("appPage")
        .classList.remove("hidden");


    // 앱 화면으로 바뀌면 맨 위로 이동

    window.scrollTo(0, 0);


    document
        .getElementById("userNameDisplay")
        .textContent =
            currentUser.name + "님";


    await loadRecords();

}


// ==========================================
// 운동 기록 불러오기
// ==========================================

async function loadRecords() {

    if (!currentUser) {
        return;
    }


    const result =
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
                    ascending: true
                }
            );


    if (result.error) {

        console.error(
            "기록 불러오기 오류:",
            result.error
        );

        alert(
            "운동 기록을 불러오지 못했습니다."
        );

        return;

    }


    records =
        result.data || [];


    render();

}


// ==========================================
// 운동 시간 합계
// 재귀 함수
// ==========================================

function sum(n) {

    if (n === 0) {
        return 0;
    }


    return (
        Number(records[n - 1].time) +
        sum(n - 1)
    );

}


// ==========================================
// 가장 오래 한 운동
// ==========================================

function getBest() {

    if (records.length === 0) {
        return null;
    }


    let best =
        records[0];


    for (
        let i = 1;
        i < records.length;
        i++
    ) {

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


// ==========================================
// 오늘의 운동
// ==========================================

function getTodayStats() {

    const today =
        new Date().toDateString();


    let total = 0;
    let count = 0;


    for (
        const record of records
    ) {

        const recordDate =
            new Date(
                record.date
            ).toDateString();


        if (
            recordDate === today
        ) {

            total +=
                Number(record.time);

            count++;

        }

    }


    return {
        total: total,
        count: count
    };

}


// ==========================================
// 이번 주 운동
// 월요일 ~ 오늘
// ==========================================

function getWeekStats() {

    const today =
        new Date();


    // 현재 요일
    // 일요일 = 0
    // 월요일 = 1
    // ...
    // 토요일 = 6

    const day =
        today.getDay();


    // 이번 주 월요일까지 며칠 전인지 계산

    const diff =
        day === 0
            ? 6
            : day - 1;


    const startOfWeek =
        new Date(today);


    startOfWeek.setDate(
        today.getDate() - diff
    );


    // 월요일 00:00:00

    startOfWeek.setHours(
        0,
        0,
        0,
        0
    );


    let total = 0;
    let count = 0;


    for (
        const record of records
    ) {

        const recordDate =
            new Date(
                record.date
            );


        if (
            recordDate >= startOfWeek &&
            recordDate <= today
        ) {

            total +=
                Number(record.time);

            count++;

        }

    }


    return {
        total: total,
        count: count
    };

}


// ==========================================
// 이번 달 운동
// 이번 달 1일 ~ 오늘
// ==========================================

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


    let total = 0;
    let count = 0;


    for (
        const record of records
    ) {

        const recordDate =
            new Date(
                record.date
            );


        if (
            recordDate >= startOfMonth &&
            recordDate <= today
        ) {

            total +=
                Number(record.time);

            count++;

        }

    }


    return {
        total: total,
        count: count
    };

}


// ==========================================
// 날짜 표시
// ==========================================

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return (
        (date.getMonth() + 1) +
        "월 " +
        date.getDate() +
        "일"
    );

}


// ==========================================
// 운동 아이콘
// ==========================================

function getIcon(name) {

    if (name.includes("농구")) {

        return "🏀";

    }


    if (name.includes("축구")) {

        return "⚽";

    }


    if (name.includes("줄넘기")) {

        return "🪢";

    }


    if (name.includes("자전거")) {

        return "🚴";

    }


    if (name.includes("수영")) {

        return "🏊";

    }


    if (
        name.includes("팔굽혀펴기") ||
        name.includes("푸쉬업")
    ) {

        return "💪";

    }


    return "🏃";

}


// ==========================================
// 화면 업데이트
// ==========================================

function render() {

    // ======================================
    // 전체 운동 통계
    // ======================================

    const total =
        records.length > 0
            ? sum(records.length)
            : 0;


    document
        .getElementById("totalTime")
        .textContent =
            total;


    document
        .getElementById("recordCount")
        .textContent =
            records.length;


    const average =
        records.length > 0
            ? total / records.length
            : 0;


    document
        .getElementById("averageTime")
        .textContent =
            average.toFixed(1);


    // ======================================
    // 가장 오래 한 운동
    // ======================================

    const best =
        getBest();


    if (best) {

        document
            .getElementById("bestName")
            .textContent =
                best.name;


        document
            .getElementById("bestTime")
            .textContent =
                best.time + "분";

    } else {

        document
            .getElementById("bestName")
            .textContent =
                "-";


        document
            .getElementById("bestTime")
            .textContent =
                "0분";

    }


    // ======================================
    // 오늘의 운동
    // ======================================

    const today =
        getTodayStats();


    document
        .getElementById("todayTime")
        .textContent =
            today.total + "분";


    document
        .getElementById("todayCount")
        .textContent =
            today.count + "회 기록";


    // ======================================
    // 이번 주 운동
    // ======================================

    const week =
        getWeekStats();


    document
        .getElementById("weekTime")
        .textContent =
            week.total + "분";


    document
        .getElementById("weekCount")
        .textContent =
            week.count + "회 기록";


    // ======================================
    // 이번 달 운동
    // ======================================

    const month =
        getMonthStats();


    document
        .getElementById("monthTime")
        .textContent =
            month.total + "분";


    document
        .getElementById("monthCount")
        .textContent =
            month.count + "회 기록";


    // ======================================
    // 운동 기록 목록
    // ======================================

    const list =
        document.getElementById(
            "recordList"
        );


    list.innerHTML = "";


    if (records.length === 0) {

        document
            .getElementById("recordStatus")
            .textContent =
                "아직 기록이 없어요.";

        return;

    }


    document
        .getElementById("recordStatus")
        .textContent =
            records.length + "개";


    // 최신 기록부터 표시

    for (
        let i = records.length - 1;
        i >= 0;
        i--
    ) {

        const record =
            records[i];


        // 기록 전체

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "record";


        // 운동 아이콘

        const icon =
            document.createElement(
                "div"
            );


        icon.className =
            "record-icon";


        icon.textContent =
            getIcon(record.name);


        // 운동 이름 + 날짜

        const info =
            document.createElement(
                "div"
            );


        info.className =
            "record-info";


        const name =
            document.createElement(
                "strong"
            );


        name.textContent =
            record.name;


        const date =
            document.createElement(
                "small"
            );


        date.textContent =
            formatDate(
                record.date
            );


        info.appendChild(name);
        info.appendChild(date);


        // 운동 시간

        const time =
            document.createElement(
                "div"
            );


        time.className =
            "record-time";


        time.textContent =
            record.time + "분";


        // 삭제 버튼

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.className =
            "delete-button";


        deleteButton.textContent =
            "×";


        deleteButton.addEventListener(
            "click",
            function () {

                deleteRecord(
                    record.id
                );

            }
        );


        // 화면에 추가

        div.appendChild(icon);
        div.appendChild(info);
        div.appendChild(time);
        div.appendChild(deleteButton);


        list.appendChild(div);

    }

}


// ==========================================
// 운동 기록 추가
// ==========================================

document
    .getElementById("exerciseForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "로그인해주세요."
                );

                return;

            }


            const name =
                document
                    .getElementById(
                        "nameInput"
                    )
                    .value
                    .trim();


            const time =
                Number(
                    document
                        .getElementById(
                            "timeInput"
                        )
                        .value
                );


            // 운동 이름 검사

            if (name === "") {

                alert(
                    "운동 이름을 입력해주세요."
                );

                return;

            }


            // 운동 시간 검사

            if (
                !Number.isFinite(time) ||
                time <= 0
            ) {

                alert(
                    "운동 시간을 올바르게 입력해주세요."
                );

                return;

            }


            // ==================================
            // Supabase에 기록 저장
            // ==================================

            const result =
                await supabaseClient
                    .from(
                        "exercise_records"
                    )
                    .insert({

                        user_id:
                            currentUser.id,

                        name:
                            name,

                        time:
                            time,

                        date:
                            new Date()
                                .toISOString()

                    })
                    .select()
                    .single();


            // 저장 오류

            if (result.error) {

                console.error(
                    "운동 기록 저장 오류:",
                    result.error
                );


                alert(
                    "운동 기록 저장에 실패했습니다.\n\n" +
                    result.error.message
                );


                return;

            }


            // ==================================
            // 새 기록을 현재 배열에도 추가
            // ==================================

            records.push(
                result.data
            );


            // ==================================
            // 화면 즉시 업데이트
            //
            // 여기서 render()가 실행되면서
            // 오늘 / 이번 주 / 이번 달
            // 모두 다시 계산됨
            // ==================================

            render();


            // 입력창 초기화

            document
                .getElementById(
                    "nameInput"
                )
                .value = "";


            document
                .getElementById(
                    "timeInput"
                )
                .value = "";


            // 팝업 닫기

            closeModal();


            // 저장 알림

            showToast();

        }
    );


// ==========================================
// 운동 기록 삭제
// ==========================================

async function deleteRecord(id) {

    const answer =
        confirm(
            "이 운동 기록을 삭제할까요?"
        );


    if (!answer) {
        return;
    }


    const result =
        await supabaseClient
            .from(
                "exercise_records"
            )
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (result.error) {

        console.error(
            "삭제 오류:",
            result.error
        );


        alert(
            "삭제에 실패했습니다."
        );


        return;

    }


    // 현재 배열에서도 삭제

    records =
        records.filter(
            record =>
                record.id !== id
        );


    // 삭제 후
    // 오늘 / 주간 / 월간 통계까지
    // 전부 다시 계산

    render();

}


// ==========================================
// 전체 삭제
// ==========================================

async function clearAllRecords() {

    if (records.length === 0) {

        alert(
            "삭제할 기록이 없습니다."
        );

        return;

    }


    const answer =
        confirm(
            "모든 운동 기록을 삭제할까요?"
        );


    if (!answer) {
        return;
    }


    const result =
        await supabaseClient
            .from(
                "exercise_records"
            )
            .delete()
            .eq(
                "user_id",
                currentUser.id
            );


    if (result.error) {

        console.error(
            "전체 삭제 오류:",
            result.error
        );


        alert(
            "삭제에 실패했습니다."
        );


        return;

    }


    records = [];


    // 전체 삭제 후
    // 모든 통계를 0으로 변경

    render();

}


// ==========================================
// 운동 추가 팝업
// ==========================================

document
    .getElementById("addButton")
    .addEventListener(
        "click",
        function () {

            document
                .getElementById("modal")
                .classList.remove(
                    "hidden"
                );


            document
                .getElementById(
                    "nameInput"
                )
                .focus();

        }
    );


// ==========================================
// 팝업 닫기
// ==========================================

function closeModal() {

    document
        .getElementById("modal")
        .classList.add(
            "hidden"
        );

}


document
    .getElementById("closeButton")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("modalBackground")
    .addEventListener(
        "click",
        closeModal
    );


// ==========================================
// 전체 삭제 버튼
// ==========================================

document
    .getElementById("clearButton")
    .addEventListener(
        "click",
        clearAllRecords
    );


// ==========================================
// 로그아웃 버튼
// ==========================================

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        function () {

            currentUser = null;

            records = [];


            removeLogin();


            document
                .getElementById("appPage")
                .classList.add(
                    "hidden"
                );


            document
                .getElementById("authPage")
                .classList.remove(
                    "hidden"
                );


            document
                .getElementById(
                    "authName"
                )
                .value = "";


            document
                .getElementById(
                    "authPassword"
                )
                .value = "";


            showAuthMessage("");


            render();

        }
    );


// ==========================================
// 통계 버튼
// ==========================================

document
    .getElementById("statsButton")
    .addEventListener(
        "click",
        function () {

            const total =
                records.length > 0
                    ? sum(records.length)
                    : 0;


            const average =
                records.length > 0
                    ? (
                        total /
                        records.length
                    ).toFixed(1)
                    : "0.0";


            alert(

                "총 운동 시간: " +
                total +
                "분\n\n" +

                "운동 기록: " +
                records.length +
                "개\n\n" +

                "평균 운동 시간: " +
                average +
                "분"

            );

        }
    );


// ==========================================
// 저장 알림
// ==========================================

function showToast() {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.classList.add(
        "show"
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        1800
    );

}


// ==========================================
// 프로그램 시작
// ==========================================

async function start() {

    const savedUser =
        loadLogin();


    if (savedUser) {

        currentUser =
            savedUser;


        await openApp();

    } else {

        document
            .getElementById("authPage")
            .classList.remove(
                "hidden"
            );


        document
            .getElementById("appPage")
            .classList.add(
                "hidden"
            );

    }

}


start();
