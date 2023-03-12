(function () {
    document.querySelector('#exportCsv').onclick = () => exportHistory('CSV');
    document.querySelector('#exportJson').onclick = () => exportHistory('JSON');

    function exportHistory(type) {
        const exporter = getExporterByType(type);
        const query = {
            text: '',
            maxResults: Math.pow(2, 31) - 1,
            startTime: new Date(2000, 0, 1).getTime(),
            endTime: new Date().getTime()
        };
        const formatter = new Intl.DateTimeFormat(
            undefined,
            {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }
        );

        chrome.history.search(query)
            .then(items => items.map(item => ({
                ...item,
                lastVisitTime: formatter.format(item.lastVisitTime)
            })))
            .then(items => exporter(items))
            .catch(error => console.error(error));
    }

    function getExporterByType(type) {
        switch (type) {
            case 'CSV':
                return exportToCsv;
            case 'JSON':
                return exportToJson;
            default:
                throw new Error('未知的匯出類型');
        }
    }

    function exportToCsv(items) {
        const filename = createFilename('history', 'csv');

        const rows = ['編號,標題,網址,造訪次數,最後造訪時間'];
        for (const item of items) {
            const row = [
                item.id,
                item.title.replace(/,/g, '\\,'),
                item.url.replace(/,/g, '\\,'),
                item.visitCount,
                item.lastVisitTime
            ];

            rows.push(row.join(','));
        }

        downloadTextFile(rows.join('\n'), filename, 'text/csv');
    }

    function createFilename(filename, extension) {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return `${filename}-${year}-${month}-${day}.${extension}`;
    }

    function downloadTextFile(text, filename, contentType) {
        const blob = new Blob([text], {type: contentType});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    }

    function exportToJson(items) {
        downloadTextFile(
            JSON.stringify(items),
            createFilename('history', 'json'),
            'application/json'
        );
    }
})();
