echo "prepare environment"

mkdir -p `pwd`/ledger/devdata/wallet/
cp vite_e41be57d38c796984952fad618a9bc91637329b5255cb18906 `pwd`/ledger/devdata/wallet/

echo "start gvite"

exec ./gvite