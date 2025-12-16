const Authorization = '<enter your authorization token here>'
async function deleteCredential(credId) {
    const response = await fetch(`https://helium.prodeu1.openpath.com/orgs/16283/users/7124384/credentials/${credId}`, {

        method: 'DELETE',
        headers: {
            Authorization
        }
    })
    return response.ok
}

(async () => {
    const creds = await fetch('https://helium.prodeu1.openpath.com/orgs/16283/users/7124384/credentials?limit=1000&offset=0', {
        headers: {
            Authorization
        }
    })
    if (creds.ok) {
        const yesterday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 2)


        const data = await creds.json()
        const overdue = data.data.filter(cred => cred.endDate && new Date(cred.endDate) < yesterday)
        let count = 0
        for (const cred of overdue) {
            await deleteCredential(cred.id)
            count++
            console.log(`Deleted ${count} of ${overdue.length} credentials`)
        }
    } else {
        console.error('Failed to fetch credentials', creds.statusText)
    }
})()