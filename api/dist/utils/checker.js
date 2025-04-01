export function isEmail(username, domains) {
    // regex for email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(username)) {
        if (domains) {
            const domain = username.split("@")[1];
            return domains.includes(domain);
        }
        return true;
    }
    return false;
}
export function isRegNo(username) {
    // regex for registration number validation has only numbers
    const regNoRegex = /^[0-9]+$/;
    return regNoRegex.test(username);
}
