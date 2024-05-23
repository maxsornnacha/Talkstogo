import axios from 'axios'

//ดึง ข้อมูล accounts && token_key จาก session

const UserDataFetching = async () => {
                try {
                    const response = await axios.get(`${process.env.API_URL}/account-data`, {
                        withCredentials: true,
                      });
                    return response.data;
                } catch (error) {
                    console.error("Error fetching user data:", error.message);
                    return null;
                }
        
};


export default UserDataFetching;