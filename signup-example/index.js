const mongoose = require('mongoose');

// MongoDB 연결 설정
mongoose.connect('mongodb://localhost:27017/signup-example')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Could not connect to MongoDB', err);
    });

const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const app = express();
const port = 3000;

// JSON 파싱을 위한 미들웨어
app.use(express.json());

// 회원가입 라우트
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Step 1: 이메일 중복 체크
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Email already exists'); // 로그 추가
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Step 2: 비밀번호 해싱
        if (!password) {
            console.error('Password is missing');
            return res.status(400).json({ message: 'Password is required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully'); // 로그 추가

        // Step 3: 새로운 사용자 생성
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        // Step 4: 사용자 저장
        await newUser.save();
        console.log('User registered successfully'); // 로그 추가
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error); // 에러 로그
        res.status(500).json({ message: 'Error registering user' });
    }
});


// 로그인 라우트
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        res.status(200).json({ message: "User logged in successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in user' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
