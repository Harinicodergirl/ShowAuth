import { useEffect, useRef } from "react";

export default function useTracking() {
    const keyEventsRef = useRef([]);
    const mouseEventsRef = useRef([]);

    const lastMouseRef = useRef(null);
    const eventCountRef = useRef(0);

    const API_URL = "http://localhost:5000/predict";

    const sessionIdRef = useRef(crypto.randomUUID());
    const EVENT_THRESHOLD = 200;
    const SEND_INTERVAL = 30000;

    const getEpochSeconds = () => Date.now() / 1000;

    const pushKeyEvent = (key, eventType) => {
        keyEventsRef.current.push({
            key,
            event: eventType,
            epoch: getEpochSeconds()
        });

        eventCountRef.current += 1;
        checkThreshold();
    };

    const pushMouseEvent = (eventType, x, y) => {
        mouseEventsRef.current.push({
            event: eventType,
            x,
            y,
            epoch: getEpochSeconds()
        });

        eventCountRef.current += 1;
        checkThreshold();
    };

    const handleKeyDown = (e) => {
        pushKeyEvent(e.key, "pressed");
    };

    const handleKeyUp = (e) => {
        pushKeyEvent(e.key, "released");
    };

    const handleMouseMove = (e) => {
        const current = {
            x: e.clientX,
            y: e.clientY,
            epoch: getEpochSeconds()
        };

        if (lastMouseRef.current) {
            const dx = current.x - lastMouseRef.current.x;
            const dy = current.y - lastMouseRef.current.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2) {
                return;
            }
        }

        lastMouseRef.current = current;

        pushMouseEvent(
            "movement",
            current.x,
            current.y
        );
    };

    const handleMouseDown = (e) => {
        if (e.button === 0) {
            pushMouseEvent(
                "left_press",
                e.clientX,
                e.clientY
            );
        }
    };

    const handleMouseUp = (e) => {
        if (e.button === 0) {
            pushMouseEvent(
                "left_release",
                e.clientX,
                e.clientY
            );
        }
    };

const buildPayload = () => {
    return {

        session_id: sessionIdRef.current,

        key_events: [...keyEventsRef.current],

        mouse_events: [...mouseEventsRef.current],

        transaction_data: {

            transaction_id: crypto.randomUUID(),

            sender_account: "ACC1001",

            receiver_account: "ACC2002",

            amount: 25000,

            transaction_type: "UPI",

            merchant_category: "electronics",

            location: "Chennai",

            device_used: navigator.userAgent,

            payment_channel: "web",

            ip_address: "192.168.1.10",

            device_hash: "abc123xyz"
        }
    };
};

    const clearEvents = () => {
        keyEventsRef.current = [];
        mouseEventsRef.current = [];
        eventCountRef.current = 0;
    };

    const sendEvents = async () => {
        const payload = buildPayload();

        if (
            payload.key_events.length === 0 &&
            payload.mouse_events.length === 0
        ) {
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Failed to send tracking data");
            }

            const result = await response.json();

            console.log("Risk Analysis:", result);

            clearEvents();
        }
        catch (error) {
            console.log("Backend offline — will retry later.");
            return null;
        }
    };

    const checkThreshold = () => {
        if (eventCountRef.current >= EVENT_THRESHOLD) {
            sendEvents();
        }
    };

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);

        const intervalId = setInterval(() => {
            sendEvents();
        }, SEND_INTERVAL);

        const handleBeforeUnload = () => {
            const payload = buildPayload();

            if (
                payload.key_events.length === 0 &&
                payload.mouse_events.length === 0
            ) {
                return;
            }

            navigator.sendBeacon(
                API_URL,
                JSON.stringify(payload)
            );
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);

            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);

            window.removeEventListener("beforeunload", handleBeforeUnload);

            clearInterval(intervalId);
        };
    }, []);

    return {
        sendEvents,
        getTrackingData: buildPayload
    };
}
