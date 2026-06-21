# FaceGuard Authentication Implementation

## Реализовано

### 1. Архитектура (Clean Code)
```
src/
├── types/
│   └── auth.types.ts          # TypeScript типы для auth
├── services/
│   └── api.service.ts          # Axios клиент с автоматическим JWT
├── contexts/
│   └── AuthContext.tsx         # React Context для управления auth
├── hooks/
│   └── useAuth.ts              # Хук для доступа к auth
├── utils/
│   └── token.utils.ts          # Утилиты для работы с токенами
└── app/
    └── components/
        ├── auth/
        │   ├── LoginPage.tsx   # Страница входа
        │   └── RegisterPage.tsx # Страница регистрации
        └── ProtectedRoute.tsx   # HOC для защиты роутов
```

### 2. Безопасность
- ✅ JWT токены хранятся в localStorage
- ✅ Автоматическое добавление токена в заголовки всех запросов
- ✅ Автоматический редирект на /login при 401 ошибке
- ✅ Валидация форм (username ≥3, password ≥8 символов)
- ✅ Защита от пустых значений
- ✅ Визуальная индикация силы пароля при регистрации
- ✅ Показ/скрытие пароля

### 3. API Integration
**Base URL:** `http://10.93.26.183:8000/api/v1`

**Endpoints:**
- `POST /auth/login` - вход
- `POST /auth/register` - регистрация
- `GET /auth/me` - получение текущего пользователя

### 4. Роуты
- `/login` - публичный, форма входа
- `/register` - публичный, форма регистрации  
- `/` - защищённый (Dashboard)
- `/camera` - защищённый
- `/people` - защищённый
- `/logs` - защищённый
- `/system` - защищённый
- `/settings` - защищённый

### 5. UI/UX Features
- Тёмная тема в стиле существующего интерфейса
- Loading states при отправке форм
- Toast уведомления для success/error
- Автоматическая проверка токена при загрузке приложения
- Отображение реального username и роли в Layout
- Рабочий logout с очисткой токена
- Индикатор силы пароля (Weak/Medium/Strong) с цветовой кодировкой
- Подтверждение совпадения паролей с визуальной индикацией

### 6. AuthContext Methods
```typescript
{
  user: User | null;           // Текущий пользователь
  isLoading: boolean;          // Загрузка
  isAuthenticated: boolean;    // Статус авторизации
  login: (credentials) => Promise<void>;
  register: (data) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

## Запуск

```bash
cd frontend/faceguard-web
npm run dev
```

**Dev Server:** http://localhost:5175

## Как работает

### Первый запуск (регистрация)
1. Открыть http://localhost:5175
2. Автоматический редирект на `/login`
3. Нажать "Register"
4. Заполнить форму (username ≥3, password ≥8)
5. После регистрации — редирект на `/login`
6. Войти с созданными credentials

### Вход
1. Ввести username и password
2. При успехе — токен сохраняется, редирект на `/`
3. Layout показывает реальные данные пользователя
4. Все API запросы автоматически включают JWT токен

### Logout
1. Нажать на иконку logout в sidebar или header
2. Токен удаляется, редирект на `/login`

## API Service Features

```typescript
// Автоматически добавляет токен к запросам
config.headers.Authorization = `Bearer ${token}`;

// Автоматический logout при 401
if (error.response?.status === 401) {
  tokenUtils.removeToken();
  window.location.href = "/login";
}
```

## Защита роутов

```tsx
<ProtectedRoute>
  <Layout />
</ProtectedRoute>
```

Если пользователь не авторизован — автоматический редирект на `/login`.

## Token Persistence

Токен сохраняется в `localStorage` с ключом `faceguard_token`, поэтому авторизация сохраняется между перезагрузками страницы.

## Следующие шаги (опционально)

- [ ] Добавить "Remember me" функционал
- [ ] Реализовать refresh токены (если backend поддерживает)
- [ ] Добавить восстановление пароля
- [ ] Добавить rate limiting на формы
- [ ] Перенести токен в httpOnly cookie для большей безопасности
- [ ] Добавить 2FA (если требуется)

## Примечания

- Первый зарегистрированный пользователь автоматически получает роль `superadmin` (backend логика)
- JWT токены истекают через 30 минут (настройка backend)
- Все формы имеют валидацию на клиенте и сервере
- UI полностью соответствует существующему стилю приложения
