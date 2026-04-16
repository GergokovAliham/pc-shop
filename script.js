// script.js
(function() {
    'use strict';

    // Инициализация базы (localStorage)
    if (!localStorage.getItem('compUsers')) {
        localStorage.setItem('compUsers', JSON.stringify([]));
    }
    if (!localStorage.getItem('compRequests')) {
        localStorage.setItem('compRequests', JSON.stringify([]));
    }

    // Вспомогательные функции
    function getUsers() {
        return JSON.parse(localStorage.getItem('compUsers')) || [];
    }

    function saveUsers(users) {
        localStorage.setItem('compUsers', JSON.stringify(users));
    }

    function getRequests() {
        return JSON.parse(localStorage.getItem('compRequests')) || [];
    }

    function saveRequests(requests) {
        localStorage.setItem('compRequests', JSON.stringify(requests));
    }

    // Получить текущего пользователя
    function getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('currentUser'));
    }

    function setCurrentUser(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    function logout() {
        sessionStorage.removeItem('currentUser');
        updateAuthUI();
        if (window.location.pathname.includes('create_request')) {
            window.location.href = 'login.html';
        }
    }

    // Обновление UI в шапке
    function updateAuthUI() {
        const userDisplay = document.getElementById('userDisplay');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginLink = document.getElementById('loginLink');
        const currentUser = getCurrentUser();

        if (currentUser) {
            if (userDisplay) userDisplay.textContent = `👤 ${currentUser.fullName || currentUser.login}`;
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (loginLink) loginLink.style.display = 'none';
        } else {
            if (userDisplay) userDisplay.textContent = 'Гость';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginLink) loginLink.style.display = 'inline-block';
        }
    }

    // Проверка авторизации и блокировка страницы заявок
    function checkAccess() {
        const path = window.location.pathname;
        const currentUser = getCurrentUser();
        const requestForm = document.getElementById('requestForm');
        const unauthMsg = document.getElementById('unauthorizedMessage');

        if (path.includes('create_request')) {
            if (!currentUser) {
                if (requestForm) requestForm.style.display = 'none';
                if (unauthMsg) unauthMsg.style.display = 'block';
            } else {
                if (requestForm) requestForm.style.display = 'block';
                if (unauthMsg) unauthMsg.style.display = 'none';
                loadUserRequests();
            }
        }
    }

    // Загрузка заявок пользователя
    function loadUserRequests() {
        const tbody = document.getElementById('requestsBody');
        if (!tbody) return;
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const allRequests = getRequests();
        const userReqs = allRequests.filter(r => r.userId === currentUser.id).sort((a,b) => b.id - a.id);

        if (userReqs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">У вас пока нет заявок.</td></tr>`;
            return;
        }

        tbody.innerHTML = userReqs.map(req => `
            <tr>
                <td>${req.id}</td>
                <td>${new Date(req.createdAt).toLocaleString()}</td>
                <td>${req.serviceType}</td>
                <td>${req.address}</td>
                <td>${req.paymentType}</td>
                <td>${req.status || 'Новая'}</td>
            </tr>
        `).join('');
    }

    // Обработка регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const login = document.getElementById('regLogin').value.trim();
            const password = document.getElementById('regPassword').value;
            const fullName = document.getElementById('regFullName').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const msgBox = document.getElementById('messageBox');

            // Простейшая валидация
            if (login.length < 3) {
                msgBox.innerHTML = '<div class="notification error">Логин должен быть не менее 3 символов</div>';
                return;
            }
            if (password.length < 6) {
                msgBox.innerHTML = '<div class="notification error">Пароль должен быть не менее 6 символов</div>';
                return;
            }

            const users = getUsers();
            if (users.find(u => u.login === login)) {
                msgBox.innerHTML = '<div class="notification error">Пользователь с таким логином уже существует</div>';
                return;
            }

            const newUser = {
                id: Date.now(),
                login,
                password, // в реальном проекте нужно хешировать
                fullName,
                phone,
                email,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            saveUsers(users);
            msgBox.innerHTML = '<div class="notification success">Регистрация успешна! Теперь вы можете войти.</div>';
            registerForm.reset();
        });
    }

    // Обработка входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const login = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const msgBox = document.getElementById('loginMessageBox');
            const users = getUsers();
            const user = users.find(u => u.login === login && u.password === password);

            if (!user) {
                msgBox.innerHTML = '<div class="notification error">Неверный логин или пароль</div>';
                return;
            }

            setCurrentUser(user);
            msgBox.innerHTML = '<div class="notification success">Вход выполнен! Перенаправление...</div>';
            setTimeout(() => {
                window.location.href = 'create_request.html';
            }, 800);
        });
    }

    // Обработка создания заявки
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentUser = getCurrentUser();
            if (!currentUser) {
                alert('Необходимо авторизоваться');
                return;
            }

            const address = document.getElementById('address').value.trim();
            const contact = document.getElementById('contact').value.trim();
            const desiredDate = document.getElementById('desiredDate').value;
            const serviceType = document.getElementById('serviceType').value;
            const paymentType = document.getElementById('paymentType').value;
            const msgBox = document.getElementById('requestMessageBox');

            const newRequest = {
                id: Date.now(),
                userId: currentUser.id,
                address,
                contact,
                desiredDate,
                serviceType,
                paymentType,
                status: 'Новая',
                createdAt: new Date().toISOString()
            };

            const requests = getRequests();
            requests.push(newRequest);
            saveRequests(requests);

            msgBox.innerHTML = '<div class="notification success">Заявка успешно создана!</div>';
            requestForm.reset();
            loadUserRequests();
        });
    }

    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Инициализация UI при загрузке
    window.addEventListener('DOMContentLoaded', () => {
        updateAuthUI();
        checkAccess();
    });

    // Экспорт для глобального доступа (необязательно)
    window.logout = logout;
})();